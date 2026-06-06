import { createClient } from "npm:@supabase/supabase-js@2.45.0"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'No authorization header' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Use service role for admin operations (credit deduction, history saving)
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    )

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser()
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const body = await req.json()
    const { 
      action, 
      sessionId, 
      documentType, 
      currentDraft,
      opportunityId,
      sourceIds,
      missingFieldsAnswers,
      tone,
      language,
      contextData
    } = body

    const manualNotes = contextData?.manualNotes || {}
    const pageCount = contextData?.pageCount
    const wordLimit = contextData?.wordLimit

    // Builder-specific custom variables
    const cvType = contextData?.cvType
    const experienceLevel = contextData?.experienceLevel
    const careerGap = contextData?.careerGap
    const careerGapExplanation = contextData?.careerGapExplanation
    const applicationStage = contextData?.applicationStage
    const projectAnchor = contextData?.projectAnchor
    const funderValues = contextData?.funderValues
    const previousAppHistory = contextData?.previousAppHistory
    const partners = contextData?.partners
    const reportingMethods = contextData?.reportingMethods
    const customQuestions = contextData?.customQuestions

    const { data: profile } = await supabaseClient
      .from('profiles').select('*').eq('id', user.id).maybeSingle()

    // Credit check
    const currentCredits = profile?.credits ?? 0
    const requiredCredits = action === "extract_context" ? 1 : (documentType === 'Roadmap' ? 3 : 1)
    if (currentCredits < requiredCredits) {
      return new Response(JSON.stringify({ 
        error: `Insufficient credits. This action requires ${requiredCredits} credits.`,
        draft: 'You do not have enough credits to perform this action. Please top up your account.',
        matchSummary: { strongMatches: [], gaps: [], priorityPoints: [] },
        editingSuggestions: [], wordCountEstimate: 0, confidence: 'low', sessionId: sessionId || 'error'
      }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Fetch opportunity details
    let opportunity = null
    if (opportunityId) {
      const { data: oppData } = await supabaseAdmin
        .from('opportunities').select('*').eq('id', opportunityId).maybeSingle()
      opportunity = oppData
    }

    // Fetch background sources
    let sources = []
    if (sourceIds && sourceIds.length > 0) {
      const { data: sourcesData } = await supabaseAdmin
        .from('profile_sources').select('*').in('id', sourceIds)
      sources = sourcesData || []
    }

    const userContext = profile
      ? `Name: ${profile.full_name || 'Unknown'}, Plan: ${profile.subscription_plan || 'Free'}`
      : `Email: ${user.email}`

    const apiKey = Deno.env.get('ANTHROPIC_API_KEY')
    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'AI not configured' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const preferredModel = Deno.env.get('CLAUDE_MODEL') || 'claude-sonnet-4-5'
    const sid = sessionId || crypto.randomUUID()

    // Layer 1: System Prompt (defines the AI assistant's role and rules)
    const experienceLevelMap: Record<string, string> = {
      "Graduate": `EXPERIENCE LEVEL: Graduate (Academic highlights & entry roles)\n- Place Education section immediately after Contact Header\n- Highlight dissertation, final year projects, academic achievements\n- Include all internships, part-time jobs, society roles, volunteering\n- Show GPA or degree classification prominently if strong\n- Skills section should be large and near the top to compensate for limited work history\n- Summary should convey ambition and potential, not experience\n- Do not pad roles — be honest about level, focus on transferable skills`,
      "Early Career": `EXPERIENCE LEVEL: Early Career (1–3 years experience)\n- Balance Education and Work Experience with roughly equal weight\n- Highlight any promotions, new responsibilities, or fast progression\n- Include all work experience including part-time or contract roles\n- Skills section still prominent\n- Summary should show trajectory and momentum`,
      "Mid Career": `EXPERIENCE LEVEL: Mid Career (3–8 years experience)\n- Work Experience is now the dominant section\n- Education should be brief — no grade unless exceptional\n- Show clear career progression across roles\n- Minimum 2–3 quantified achievements per role\n- Skills should reflect specialisation, not just basics\n- Summary should convey expertise and direction`,
      "Senior": `EXPERIENCE LEVEL: Senior (8+ years experience & leadership)\n- Open with a strong leadership-focused summary\n- Emphasise team sizes led, budgets owned, strategic decisions made\n- Show scale of impact: revenue influenced, departments managed\n- Roles older than 15 years can be condensed into one line or omitted\n- Education is minimal — degree, institution, year only\n- No need to list every responsibility — focus on outcomes`,
      "Executive": `EXPERIENCE LEVEL: Executive (Director/C-level corporate governance)\n- Summary should read like a board-level value proposition\n- Lead with executive roles, board positions, governance experience\n- Focus on corporate transformation, P&L ownership, organisational change\n- Include advisory boards or non-executive directorships if any\n- Remove all junior roles entirely — only last 10–15 years\n- Education is a single line only\n- Every line must justify C-suite positioning`
    };

    const pagesMap: Record<number, string> = {
      1: `PAGE LIMIT: 1 page only. Be extremely concise. Cut anything that doesn't directly support the target role. Prioritise the last 3 years of experience only. Summary max 2 sentences.`,
      2: `PAGE LIMIT: 2 pages. Standard professional length. Include all relevant experience from the last 10 years. No padding but no cutting of important content.`,
      3: `PAGE LIMIT: 3 pages. Extended format. Include full career history, all certifications, detailed skills, and any publications or presentations. Useful for senior or academic-leaning roles.`,
      4: `PAGE LIMIT: 4 pages. Comprehensive format. Include all career history, full education, all certifications, publications, conferences, grants, memberships. Do not omit any section.`,
      5: `PAGE LIMIT: 5 pages. Full exhaustive format. Include everything — leave nothing out. Every role, every publication, every award, every membership. Appropriate for academic or executive profiles.`
    };

    const toneMap: Record<string, string> = {
      "N/A": `TONE: Neutral standard CV language. Clear and professional. No specific stylistic instruction.`,
      "Professional (formal)": `TONE: Professional (formal)\n- Formal, polished language throughout\n- No first-person pronouns ("I", "my") — use implied third person\n- Precise vocabulary — no slang, no contractions\n- Every sentence must earn its place — remove filler phrases like "responsible for" or "tasked with"\n- Replace weak verbs with strong action verbs: led, delivered, optimised, secured, drove`,
      "Academic": `TONE: Academic (aligned with Teaching and Research CV)\n- Scholarly, measured, and precise language\n- Use discipline-appropriate terminology where relevant\n- Avoid corporate buzzwords entirely\n- Passive and active voice can be mixed as is normal in academic writing\n- Demonstrate intellectual rigour in all descriptions\n- Research interests and publications should read with authority`,
      "Creative (story-driven)": `TONE: Creative (story-driven)\n- Professional Summary should read as a compelling career narrative\n- Use vivid, specific, original language — avoid all clichés\n- Show personality while remaining professional\n- Experience descriptions should tell a story of growth, challenge, and impact\n- Avoid generic phrases — replace with specific, memorable language\n- The CV should feel human, not corporate-template-generated`,
      "Concise (short high-signal bullets)": `TONE: Concise (short high-signal bullets)\n- Every single line must earn its place — ruthlessly remove filler\n- Bullets must be 1 line maximum wherever possible\n- Professional Summary: maximum 2 sentences\n- Use numbers and metrics aggressively — no vague claims\n- Remove ALL padding phrases: "responsible for", "worked closely with", "helped to"\n- If something doesn't add signal, delete it`,
      "Casual (Friendly and warm)": `TONE: Casual (friendly and warm)\n- Approachable, human language — still professional but personable\n- Implied first-person tone is acceptable in the summary\n- Contractions are acceptable (you'll find, I've built, we delivered)\n- Show enthusiasm and personality genuinely\n- Avoid stiff or overly formal corporate language\n- The reader should feel like they're meeting a real person`
    };

    const languageMap: Record<string, string> = {
      "English (UK)": `LANGUAGE: Write entirely in British English.\nSpelling rules: programme, organise, colour, behaviour, centre, licence (noun), practise (verb), travelling, modelling, defence, catalogue.\nVocabulary: use CV (not résumé), mobile (not cell phone), post (not mail), holiday (not vacation).`,
      "English (US)": `LANGUAGE: Write entirely in American English.\nSpelling rules: program, organize, color, behavior, center, license, practice, traveling, modeling, defense, catalog.\nVocabulary: use résumé (not CV), cell phone (not mobile), mail (not post), vacation (not holiday).`,
      "French": `LANGUAGE: Write the entire CV in French (Français).\nUse formal French register throughout (vous-form implied).\nStandard French CV terminology: "Expérience professionnelle", "Formation", "Compétences", "Langues", "Références disponibles sur demande".\nDate format: month written out (janvier, février etc).\nDo not mix English and French — the entire document must be in French.`,
      "German": `LANGUAGE: Write the entire CV in German (Deutsch).\nUse formal German register throughout (Sie-form implied).\nStandard German CV terminology: "Berufserfahrung", "Ausbildung", "Kenntnisse", "Sprachen", "Referenzen auf Anfrage".\nGerman CVs typically include: date of birth, nationality, marital status in the header — include these if the user has provided them.\nDate format: DD.MM.YYYY\nDo not mix English and German — the entire document must be in German.`,
      "Spanish": `LANGUAGE: Write the entire CV in Spanish (Español).\nUse formal Spanish register (usted-form implied).\nStandard Spanish CV terminology: "Experiencia profesional", "Formación académica", "Habilidades", "Idiomas", "Referencias disponibles bajo petición".\nDate format: DD/MM/YYYY\nDo not mix English and Spanish — the entire document must be in Spanish.`
    };

    const cvTypeBlock = cvType === 'Teaching / Academic CV' ? `
    CRITICAL FORMATTING RULES FOR ACADEMIC CV:
    - Philosophy: Formal, comprehensive scholarship. Academic CVs can be 4–10+ pages. Focus on scholarship & credentials.
    - Section Order & Priority:
      1. Contact Header (Include institutional email, department, university affiliation, ORCID ID)
      2. ACADEMIC PROFILE / RESEARCH INTERESTS
      3. EDUCATION
      4. WORK EXPERIENCE
      5. TEACHING EXPERIENCE
      6. ADMINISTRATIVE EXPERIENCE
      7. RESEARCH EXPERIENCE
      8. PUBLICATIONS
      9. CONFERENCE PRESENTATIONS
      10. GRANTS & FUNDING
      11. PROFESSIONAL MEMBERSHIPS
      12. AWARDS & HONOURS
      13. SKILLS & LANGUAGES
      14. REFERENCES
    - ACADEMIC PROFILE / RESEARCH INTERESTS: 3-5 sentences, paragraph form. Covers research specialization, methodological approach, current projects/interests.
    - EDUCATION: Exhaustive detail. PhD in [Field] | University | YYYY. Include Thesis title, Supervisor name, Committee members, and honours/distinctions.
    - WORK EXPERIENCE: All work experience, title and dates listed only. Paragraph + bullets if relevant.
    - TEACHING EXPERIENCE: Course Code + Course Title + Level + Year. Bullet describing role (sole instructor, etc). Note class sizes.
    - ADMINISTRATIVE EXPERIENCE: Include project supervision, invigilating exams, managing data.
    - RESEARCH EXPERIENCE: Bulletin list.
    - PUBLICATIONS: Core section. Numbered list (not bullets), format as APA/MLA, sub-divided into: Peer-Reviewed Journal Articles, Book Chapters, Books / Monographs, Under Review / In Press. Bold the user's name in each citation.
    - REFERENCES: Named referees included. 2-3 referees with Full name, title, institution, email, phone.
    - Do not mix this format with a corporate Work CV format under any circumstance.` : `
    CRITICAL FORMATTING RULES FOR WORK CV:
    - Philosophy: Achievements-first, recruiter-scannable, ATS-optimized. Every section should answer "what value did you deliver?"
    - Section Order & Priority:
      1. Contact Header (Name, Job Title, Email, Phone, LinkedIn, Location (city only), Portfolio/GitHub. NO photo, DOB, or marital status)
      2. PROFESSIONAL SUMMARY
      3. CORE SKILLS / COMPETENCIES
      4. WORK EXPERIENCE
      5. EDUCATION
      6. CERTIFICATIONS & COURSES
      7. TOOLS & TECHNOLOGIES
      8. LANGUAGES
      9. VOLUNTEER / EXTRA
    - PROFESSIONAL SUMMARY: 3-4 sentences, paragraph form (NOT bullets). Include: who you are -> key strength -> value proposition -> what you are seeking.
    - CORE SKILLS / COMPETENCIES: 8-16 items max, bullet list. Hard + soft skills mixed. NO proficiency bars.
    - WORK EXPERIENCE: Most important section. Format per role: "Job Title | Company Name | City | Month YYYY - Month YYYY". Start with 1 sentence describing role scope, then 3-6 bullet points starting with strong action verbs showing impact/metrics. NO duty-style bullets.
    - EDUCATION: Degree | Institution | Year. Brief, 1-2 lines per entry. NO modules/courses listed.
    - CERTIFICATIONS & COURSES: Bullet list, reverse chronological: Certification Name | Issuing Body | Year.`;

    const systemPrompt = `You are a premium career coach and grant proposal writer for the PATHEW platform (rebranded as Pathew Assistant).
Your objective is to help the user prepare highly polished, custom, high-converting documents (CVs, Resumes, Cover Letters, or Grant/Fellowship Proposals).

${toneMap[tone || profile?.assistant_settings?.tone || 'Professional (formal)'] || toneMap['Professional (formal)']}

${languageMap[language || 'English (UK)'] || languageMap['English (UK)']}

Core Principles & Source Prioritization:
- You will receive multiple sources of truth (User Profile, Uploaded CVs/PDFs, LinkedIn data, Manual Notes). 
- PRIORITY 1: Uploaded CVs/PDFs (use as the major source of truth for exact dates and bullet points).
- PRIORITY 2: Manual Notes (use for specific context or custom requests).
- PRIORITY 3: Database Profile Data (use as the baseline core truth).
- Merge and deduplicate information intelligently across these sources.
- Strictly compare the user's background with the opportunity requirements. Identify real matches and gaps.
- NEVER invent qualifications, experience, dates, or metrics. Be specific, but keep to the absolute truth of what is provided.
- Optimize the copy to maximize conversion (ATS optimization, impact metrics, narrative flow).

====================================================================
BUILDER-SPECIFIC SYSTEM RULES:
====================================================================

1) CV BUILDER SPECIFIC RULES:
- Target CV Type requested: ${cvType || 'Work CV'}. You MUST strictly follow the formatting rules for this specific type!

${cvTypeBlock}

${experienceLevelMap[experienceLevel || 'Mid Career'] || experienceLevelMap['Mid Career']}

${pagesMap[pageCount || 2] || pagesMap[2]}

- Career Gap positive reframing:
  * If careerGap is true (${careerGap}), read the explanation: "${careerGapExplanation}". Positive-frame this break seamlessly in the Personal Summary or professional timeline as parental dedication, caregiving resilience, self-motivated study, or career pivot/re-alignment. Frame this break as a positive development, career pivot, or self-motivated development break, demonstrating growth, resilience, and readiness to deliver immediate value. Do not hide the gap awkwardly.

ABSOLUTE RULES — never break these:
- Follow the CV Type structure exactly — never invent sections not listed
- Never mix Work CV and Academic CV formats
- Respect the page limit — do not exceed it
- Apply the tone consistently from the first word to the last
- Write the entire CV in the specified language — no switching
- Output CV content only — no explanations, no commentary, no preamble
- Section headers should be in BOLD or ALL CAPS`;

2) COVER LETTER BUILDER SPECIFIC RULES:
- Word Count target: ${wordLimit || 350} words. Ensure it is constrained strictly by this word limit (avoid overly wordy paragraphs).
- Application Stage tone:
  * "Applying for an advertised role": standard professional opening matching skills to the role.
  * "Speculative application": clear speculative outreach stating interest in the company, highlighting direct value, and requesting a exploratory talk.
  * "Following a referral": name reference/connection directly in opening sentence.
  * "Responding to a recruiter": open acknowledging their outreach and demonstrating direct enthusiasm.
- Central Project Anchor: you MUST center the cover letter around this specific highlight: "${projectAnchor}". Frame the value proposition of the letter around this core achievement.

3) GRANT BUILDER SPECIFIC RULES:
- Page Count target: ${pageCount || 3} pages.
- Funder values alignment: align terms, vocabulary, and objectives directly to mirror: "${funderValues}".
- Previous Application History:
  * If previousAppHistory.applied_before is true, read the feedback: "${previousAppHistory?.feedback}". Specifically call out in the narrative how the project has evolved and direct steps taken to address that feedback, ensuring we do not repeat past failed patterns.
- Partnership details:
  * If a partnership is specified (has_partner is true), highlight the co-applicant capacity of "${partners?.partner_name}" in the role of "${partners?.partner_role}".
  * If solo, use user profile company name "${profile?.company_name || 'Primary Organization'}" as primary executing agency.
- Reporting & Accountability: weave in a solid Accountability & Reporting section focusing heavily on these performance indicators: ${JSON.stringify(reportingMethods || [])}.
- Dynamic Custom Questions: you MUST systematically answer every question listed in: ${JSON.stringify(customQuestions || [])}. Format each response clearly under a corresponding heading matching the question, adhering to its specific question word limit.

CRITICAL: Your ENTIRE response must be a valid JSON object with this exact structure. Do not put markdown wraps or "json" prefix blocks; output only the raw JSON.
Ensure you properly escape all newlines as \\n inside strings to make it valid JSON. NEVER use raw unescaped newlines inside the JSON string values.
{
  "draft": "Your detailed drafted document or summary here. Clean text only, no raw JSON.",
  "matchSummary": {
    "strongMatches": ["Match point 1", "Match point 2"],
    "gaps": ["Gap point 1", "Gap point 2"],
    "priorityPoints": ["Strategic advice 1", "Strategic advice 2"]
  },
  "missingFields": [
    {
      "key": "specific_field_key",
      "label": "Input Label (e.g. Next.js Experience)",
      "type": "text" | "textarea",
      "description": "Short explanation of why this missing detail is needed for a high-converting draft."
    }
  ],
  "editingSuggestions": ["Suggestion 1", "Suggestion 2"],
  "wordCountEstimate": 300,
  "estimatedPages": ${pageCount || 2},
  "confidence": "high" | "medium" | "low"
}

If the user asks for a Roadmap or Preparation Plan, format the draft with clear "Week X:" headings on new lines.`

    // Layer 2: Context Prompt (compiles user profile, sources, target opportunity, and filled answers)
    let backgroundContextText = ""
    const useProfile = contextData?.useProfile ?? (!sourceIds || sourceIds.length === 0 || sourceIds.includes('pathew-profile'))
    
    if (profile && useProfile) {
      backgroundContextText += `--- USER PROFILE DATA ---
Full Name: ${profile.full_name || 'N/A'}
Professional Story: ${profile.story || 'N/A'}
Skills: ${JSON.stringify(profile.skills || [])}
Work History: ${JSON.stringify(profile.experience || [])}
Education: ${JSON.stringify(profile.education || [])}
Achievements: ${JSON.stringify(profile.achievements || [])}
Projects: ${JSON.stringify(profile.projects || [])}
`
    }

    if (manualNotes && Object.keys(manualNotes).length > 0) {
      backgroundContextText += `--- DYNAMIC MANUAL NOTES & CONTEXT ---
Custom Question Notes: ${manualNotes.customQuestionNotes || 'N/A'}
Leadership Achievements: ${manualNotes.leadershipAchievements || 'N/A'}
Project Notes & Objectives: ${manualNotes.projectNotes || 'N/A'}
Additional Context: ${manualNotes.additionalContext || 'N/A'}
`
    }
    if (sources.length > 0) {
      backgroundContextText += `--- USER BACKGROUND DOCUMENTS ---\n`
      sources.forEach((src, idx) => {
        backgroundContextText += `Source [${idx + 1}] (${src.source_type} - ${src.file_name || 'Note'}):\n${src.raw_text || ''}\n`
      })
    }

    let opportunityContextText = `--- TARGET OPPORTUNITY ---\n`
    if (opportunity) {
      opportunityContextText += `Title: ${opportunity.title || 'N/A'}
Organization/Funder: ${opportunity.organization_name || opportunity.funder_name || 'N/A'}
Type: ${opportunity.type || 'N/A'}
Location: ${opportunity.location || 'N/A'}
Deadline: ${opportunity.deadline || 'N/A'}
Requirements: ${JSON.stringify(opportunity.requirements || [])}
Description: ${opportunity.description || 'N/A'}
`
      if (opportunity.amount) {
        opportunityContextText += `Funding Amount: ${opportunity.amount} ${opportunity.amount_currency || 'GBP'}\n`
      }
      if (opportunity.duration) {
        opportunityContextText += `Duration: ${opportunity.duration}\n`
      }
    } else {
      opportunityContextText += `Description: ${currentDraft || '(No current opportunity description provided)'}\n`
    }

    let missingAnswersText = ""
    if (missingFieldsAnswers && Object.keys(missingFieldsAnswers).length > 0) {
      missingAnswersText = `--- USER ANSWERS TO GAPS / MISSING INFO ---\n${JSON.stringify(missingFieldsAnswers)}\n`
    }

    const contextPrompt = `
[USER BACKGROUND MATERIAL]
${backgroundContextText}

[OPPORTUNITY REQUIREMENTS]
${opportunityContextText}

${missingAnswersText}
Document Type requested: ${documentType || 'CV'}
Current Draft: ${currentDraft || '(No current draft)'}
`

    // Add Document Target Constraints guidelines
    const documentConstraints = []
    if (pageCount) documentConstraints.push(`Target Page Count: ${pageCount} pages`)
    if (wordLimit) documentConstraints.push(`Target Word Limit: ${wordLimit} words`)
    
    // Add 250 character limit for profile setup fields
    const profileSetupContexts = ['Personal Story', 'Skills Assistant', 'Experience Assistant', 'Achievement Assistant', 'Goals Assistant', 'Education Assistant'];
    if (profileSetupContexts.includes(documentType)) {
      documentConstraints.push(`Target Character Limit: MAXIMUM 250 CHARACTERS. Your entire draft response MUST NOT exceed 250 characters under any circumstances.`);
    }

    const constraintsInstruction = documentConstraints.length > 0
      ? `Ensure the generated draft STRICTLY complies with these target constraints: ${documentConstraints.join(' and ')}.`
      : ""

    // Layer 3: Task Prompt (specifies the operation to execute)
    let taskPrompt = ""
    if (action === "extract_context") {
      taskPrompt = `Task: Extraction & Gap Analysis
Instructions:
1. Carefully read the [USER BACKGROUND MATERIAL] and compare it against the [OPPORTUNITY REQUIREMENTS].
2. Populate "matchSummary" with actual matches ("strongMatches") and key mismatches/gaps ("gaps").
3. Determine if there is any crucial information missing to make this document high-converting. List these missing fields in the "missingFields" array. Limit to the 3-6 critical items (e.g. specific project metrics, target timelines, missing dates, or funder questions if not answered).
4. For the "draft" field, write a brief, friendly, professional summary (1-2 paragraphs) outlining what PATHEW has understood, what fits beautifully, and why we are asking for these missing details.`
    } else if (action && action.startsWith("regenerate:")) {
      const instructions = action.substring("regenerate:".length).trim();
      taskPrompt = `Task: Tailored Section Rewrite / Document Regeneration
Instructions:
1. Revise and rewrite the [Current Draft] according to the following user rewrite instructions: "${instructions}".
2. You must strictly apply the requested modification (for example, if asked to remove a contact field like LinkedIn, do not include it anywhere in the header or text of the updated draft).
3. Do not invent any untruths. Maintain the overall structure of the ${documentType || 'CV'} unless requested otherwise.
4. Keep the writing in the selected tone: ${tone || 'Professional & Academic'} and the target language: ${language || 'English (UK)'}.
5. Write the full updated document text directly in the "draft" field.
6. Provide specific "editingSuggestions" based on the rewrite.`
    } else {
      taskPrompt = `Task: High-Converting Document Generation
Instructions:
1. Write a complete, high-quality, tailored draft for the document type: ${documentType || 'CV'}.
2. Use all [USER BACKGROUND MATERIAL] (including all manual notes, achievements, and project notes) and incorporate the [USER ANSWERS TO GAPS / MISSING INFO] directly into the writing.
3. Tailor the content perfectly to match the [OPPORTUNITY REQUIREMENTS] without inventing any untruths.
4. Keep the writing in the selected tone: ${tone || 'Professional & Academic'} and the target language: ${language || 'English (UK)'}.
5. ${constraintsInstruction} Ensure the draft fits perfectly within these target limits.
6. Write the full text directly in the "draft" field. Ensure it is detailed, comprehensive, and ready for use.
7. Provide specific "editingSuggestions" for improving the document further.`
    }

    const userMessageContent = `
${contextPrompt}

${taskPrompt}
`

    const modelsToTry = [
      preferredModel, "claude-sonnet-4-5", "claude-sonnet-4-6",
      "claude-opus-4-5", "claude-opus-4-6", "claude-opus-4-7", "claude-opus-4-1",
    ]
    const uniqueModels = [...new Set(modelsToTry)]

    for (const model of uniqueModels) {
      console.log(`[TRY] Model: ${model}`)
      try {
        const claudeResponse = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01',
          },
          body: JSON.stringify({
            model, max_tokens: 4096, system: systemPrompt,
            messages: [{ role: "user", content: userMessageContent.trim() }],
          }),
        })

        if (claudeResponse.ok) {
          const result = await claudeResponse.json()
          const content = result.content?.[0]?.text || ''
          const tokensIn = result.usage?.input_tokens || 0
          const tokensOut = result.usage?.output_tokens || 0
          console.log(`[SUCCESS] Model ${model} | Tokens: ${tokensIn}in/${tokensOut}out`)

          let parsedResponse
          try {
            // Find the first { and last } to extract the JSON object
            const firstBrace = content.indexOf('{')
            const lastBrace = content.lastIndexOf('}')
            if (firstBrace !== -1 && lastBrace !== -1) {
              const jsonStr = content.substring(firstBrace, lastBrace + 1)
              parsedResponse = JSON.parse(jsonStr)
            } else {
              throw new Error('No JSON object found')
            }
          } catch {
            let extractedDraft = content;
            
            // If JSON fails, try to extract the draft string value (handles truncation or unescaped newlines)
            const draftMatch = content.match(/"draft"\s*:\s*"(.*?)"(?:\s*,|\s*\}|$)/s);
            if (draftMatch && draftMatch[1]) {
               extractedDraft = draftMatch[1].replace(/\\n/g, '\n').replace(/\\"/g, '"').replace(/\\\\/g, '\\');
            } else {
               // Fallback: strip markdown wrappers
               extractedDraft = content.replace(/^```json\s*/, '').replace(/\s*```$/, '');
               // If it still starts with { and has "draft":, it's severely truncated raw json
               if (extractedDraft.trim().startsWith('{')) {
                   const rawMatch = extractedDraft.match(/"draft"\s*:\s*"(.*)/s);
                   if (rawMatch && rawMatch[1]) {
                       extractedDraft = rawMatch[1].replace(/\\n/g, '\n').replace(/\\"/g, '"').replace(/\\\\/g, '\\');
                   }
               }
            }

            parsedResponse = {
              draft: extractedDraft,
              matchSummary: { strongMatches: [], gaps: [], priorityPoints: [] },
              missingFields: [],
              editingSuggestions: [],
              wordCountEstimate: extractedDraft.split(' ').length,
              confidence: 'low',
              sessionId: sid
            }
          }

          let creditCost = requiredCredits
          if (sessionId && documentType !== 'Roadmap') {
            const { count } = await supabaseAdmin
              .from('assistant_messages')
              .select('*', { count: 'exact', head: true })
              .eq('session_id', sid)
              .eq('role', 'user')
            
            if (count && count >= 3) {
              creditCost = 0.25
            }
          }

          // === DEDUCT CREDIT ===
          const newCredits = Math.max(0, currentCredits - creditCost)
          const { error: creditError } = await supabaseAdmin.from('profiles').update({ credits: newCredits }).eq('id', user.id)
          if (creditError) console.error(`[CREDIT ERROR] ${creditError.message}`)
          else console.log(`[CREDITS] ${currentCredits} -> ${newCredits} (Cost: ${creditCost}) for user ${user.id}`)

          // === SAVE TO HISTORY ===
          if (!sessionId) {
            const { error: sessionError } = await supabaseAdmin.from('assistant_sessions').insert({
              id: sid,
              user_id: user.id,
              task: action === "extract_context" ? "Context Extraction" : (documentType || 'General Builder'),
              page: documentType || 'General'
            })
            if (sessionError) console.error(`[HISTORY ERROR SESSION] ${sessionError.message}`)
          }

          // Save user message
          const { error: userMsgError } = await supabaseAdmin.from('assistant_messages').insert({
            user_id: user.id,
            role: 'user',
            content: action === "extract_context" ? "Gap Analysis and Context Extraction" : `Draft Generation (${documentType})`,
            session_id: sid,
            tokens_in: tokensIn,
            tokens_out: 0,
          })
          if (userMsgError) console.error(`[HISTORY ERROR USER] ${userMsgError.message}`)

          // Save assistant response
          const { error: asstMsgError } = await supabaseAdmin.from('assistant_messages').insert({
            user_id: user.id,
            role: 'assistant',
            content: parsedResponse.draft || content,
            session_id: sid,
            tokens_in: 0,
            tokens_out: tokensOut,
          })
          if (asstMsgError) console.error(`[HISTORY ERROR ASST] ${asstMsgError.message}`)
          else console.log(`[HISTORY] Saved messages for session ${sid}`)

          // Add credits and sessionId info to response
          parsedResponse.creditsRemaining = newCredits
          parsedResponse.creditsDeducted = creditCost
          parsedResponse.sessionId = sid

          return new Response(JSON.stringify(parsedResponse), {
            status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          })
        }

        const errBody = await claudeResponse.text()
        console.log(`[FAIL] ${model}: ${claudeResponse.status} - ${errBody}`)

      } catch (fetchErr) {
        console.log(`[ERROR] ${model}: ${fetchErr.message}`)
      }
    }

    console.error('[FAILED] No models available')
    return new Response(JSON.stringify({
      draft: "AI service is temporarily unavailable. No credits were deducted.",
      matchSummary: { strongMatches: [], gaps: [], priorityPoints: [] },
      missingFields: [],
      editingSuggestions: [], wordCountEstimate: 0, confidence: 'low', sessionId: sid
    }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('[FATAL]', error.message)
    return new Response(JSON.stringify({
      draft: "Sorry, something went wrong. No credits were deducted.",
      matchSummary: { strongMatches: [], gaps: [], priorityPoints: [] },
      missingFields: [],
      editingSuggestions: [], wordCountEstimate: 0, confidence: 'low', sessionId: 'error'
    }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})

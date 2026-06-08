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
    const cvTypeRules: Record<string, string> = {
      "Work CV": `
CV TYPE: WORK CV (Standard Corporate Layout)

SECTION ORDER — follow exactly:
1. CONTACT HEADER
   - Full name, professional title, email, phone, LinkedIn, location (city only)
   - No photo, no DOB, no marital status

2. PROFESSIONAL SUMMARY
   - 4–6 sentences, paragraph form — NOT bullets
   - Cover: who you are → key strength → value proposition → career direction
   - Tailored and specific — never generic

3. KEY ACHIEVEMENTS (optional — include if user has strong metrics)
   - 4–6 bullets with quantified impact
   - Format: Action + Method + Result with number

4. CORE SKILLS
   - 10–16 items in a grid or grouped list
   - Mix hard and soft skills
   - No proficiency bars

5. WORK EXPERIENCE ← MOST IMPORTANT
   - Reverse chronological
   - Each role header on ONE line: Job Title | Company | Location | Mon YYYY – Mon YYYY
   - 2–3 sentences describing scope of the role (paragraph)
   - 4–6 bullets per role starting with strong action verbs
   - Every bullet must show measurable impact where possible

6. EDUCATION
   - One line per qualification: Degree | Institution | Year | Grade
   - No modules, no thesis details

7. CERTIFICATIONS
   - Bullet list, reverse chronological

8. TOOLS & TECHNOLOGIES
   - Grouped by category

9. LANGUAGES
   - Inline or short list with proficiency level

10. REFERENCES
    - "References available on request"

STRICT RULES:
- No Academic Profile section
- No Publications section
- No named references
- Action verbs only for bullets
- Quantify everything possible`,

      "Teaching / Academic CV": `
CV TYPE: TEACHING / ACADEMIC CV (Rigid Academic Sections)

SECTION ORDER — follow exactly:
1. CONTACT HEADER
   - Name, academic title, institution/department, institutional email, phone, location
   - Include ORCID ID if provided

2. EDUCATION
   - Brief — one line per qualification
   - Format: Degree | Institution | Year | Grade
   - Reverse chronological
   - NO thesis titles, NO supervisor names, NO module lists

3. WORK EXPERIENCE
   - ALL roles listed: Job Title | Institution | Mon YYYY – Mon YYYY
   - NO descriptions — titles and dates ONLY

4. TEACHING EXPERIENCE
   - Bullet list
   - Each bullet = one course or teaching role
   - Must include class size if provided
   - Must state role type: sole instructor / teaching assistant / lab demonstrator
   - Include undergraduate/postgraduate level

5. ADMINISTRATIVE EXPERIENCE
   - Bullet list
   - Only admin tied to academic work: dissertation supervision, exam invigilation,
     data/records management, timetabling, committee roles
   - State scope: number of students, years covered, scale

6. RESEARCH EXPERIENCE
   - Bullet list
   - Each bullet: your role | project title | funder | Mon YYYY – Mon YYYY

7. PUBLICATIONS
   - Numbered list, APA format
   - Bold the candidate's name in every citation
   - Subdivide into:
     a. Peer-Reviewed Journal Articles
     b. Book Chapters
     c. Books / Monographs
     d. Under Review / In Press
   - Write "Publications in progress" if none provided

8. CONFERENCE PRESENTATIONS
   - Numbered list
   - Format: Author (Year). "Title." Event, Location.

9. GRANTS & FUNDING
   - Table: Grant Name | Awarding Body | Amount | Year

10. PROFESSIONAL MEMBERSHIPS
    - Bullet or inline list with year joined

11. AWARDS & HONOURS
    - Bullet list, reverse chronological

12. SKILLS & LANGUAGES
    - Brief — tools, software, languages with proficiency

13. REFERENCES
    - "References available on request"

STRICT RULES:
- NO Academic Profile or Personal Statement section
- NO named references
- Work Experience has zero descriptions — titles and dates only
- Teaching must show class sizes where provided
- Publications must be APA format with name bolded`
    };

    const experienceLevelMap: Record<string, string> = {
      "Graduate": `
EXPERIENCE LEVEL: Graduate
- Place Education immediately after Contact Header
- Highlight dissertation, final year projects, academic prizes
- Include all internships, part-time roles, society positions, volunteering
- Show degree classification prominently
- Skills section large and near top
- Summary should convey potential and ambition, not years of experience
- Do not pad — be honest about level, focus on transferable skills`,

      "Early Career": `
EXPERIENCE LEVEL: Early Career (1–3 years)
- Balance Education and Work Experience equally
- Highlight any promotions, expanded responsibilities, early wins
- Include all work including part-time and contract roles
- Skills section still prominent
- Summary should show trajectory and learning speed`,

      "Mid Career": `
EXPERIENCE LEVEL: Mid Career (3–8 years)
- Work Experience is the dominant section
- Education brief — degree, institution, year only, no grade unless exceptional
- Show clear career progression across roles
- Minimum 3 quantified achievements per role
- Skills should reflect specialisation
- Summary conveys expertise and professional identity`,

      "Senior": `
EXPERIENCE LEVEL: Senior (8+ years & leadership)
- Open with strong leadership-focused summary
- Emphasise team sizes led, budgets owned, strategic decisions
- Show scale of impact: revenue, departments, organisations
- Condense or omit roles older than 15 years
- Education is minimal — one line only
- Focus on outcomes, not duties`,

      "Executive": `
EXPERIENCE LEVEL: Executive (Director/C-level)
- Summary reads as a board-level value proposition
- Lead with executive roles, board positions, governance experience
- Focus on transformation, P&L, organisational change
- Include advisory boards or non-executive directorships
- Remove all junior roles — last 10–15 years only
- Education is a single line only
- Every line must justify C-suite positioning`
    };

    const pagesMap: Record<number, string> = {
      1: `
PAGE TARGET: 1 PAGE — BE EXTREMELY CONCISE
- Include only: Contact Header, Summary (2 sentences), Skills, last 2 roles only, Education
- Cut every section that isn't critical
- Bullets maximum 3 per role
- Summary maximum 2 sentences
- This must feel tight and focused — not truncated`,

      2: `
PAGE TARGET: 2 PAGES — STANDARD LENGTH
- Include all core sections fully
- 4–5 bullets per work experience role
- Full skills section
- Complete education
- This is the standard professional CV length — fill both pages properly`,

      3: `
PAGE TARGET: 3 PAGES — EXTENDED FORMAT
- YOU MUST FILL 3 FULL PAGES — do not stop early
- Include all sections with full detail
- 5–6 bullets per work experience role — elaborate on impact and method
- Expand the Professional Summary to 6–8 sentences
- Add a Key Achievements section with 6–8 bullets if not already present
- Include all certifications, tools, languages in full
- Education can include relevant modules or distinctions if available
- If the user has publications or presentations, include them
- Do not leave white space — use all 3 pages`,

      4: `
PAGE TARGET: 4 PAGES — COMPREHENSIVE FORMAT
- YOU MUST FILL 4 FULL PAGES — do not stop at 1 or 2 pages
- Every section must be fully expanded and detailed
- Work Experience: 6–8 bullets per role with full context, method, and measurable outcome
- Professional Summary: 8–10 sentences — career narrative, philosophy, key strengths, value
- Key Achievements: 8–10 bullets with strong metrics
- Core Skills: 20+ skills grouped by category
- Include ALL certifications, ALL tools, ALL languages
- Add Career Highlights or Notable Projects section if space allows
- Elaborate on each job scope with 2–3 sentences before bullets
- Education can include relevant coursework, distinctions, or awards
- Do not truncate any section — expand every item fully
- The output must be long, detailed and comprehensive — 4 full pages of content`,

      5: `
PAGE TARGET: 5 PAGES — EXHAUSTIVE FORMAT
- YOU MUST FILL 5 FULL PAGES — do not stop early under any circumstances
- This is the most comprehensive CV format — include everything
- Work Experience: 8–10 bullets per role with full narrative context
- Professional Summary: 10–12 sentences
- Key Achievements: 10–12 high-impact bullets
- Every section must be present and fully expanded
- Add all optional sections: Notable Projects, Publications, Conferences, 
  Community/Volunteering, Board Positions, Speaking Engagements
- Skills: comprehensive grouped list of 25+ items
- Certifications: every certification with issuing body and year
- Do not summarise or condense anything — write in full detail throughout
- The output must be exhaustive — 5 full pages minimum`
    };

    const toneMap: Record<string, string> = {
      "N/A": `TONE: Neutral, clear, standard professional CV language.`,

      "Professional (formal)": `
TONE: Professional (formal)
- Formal polished language — no slang, no contractions
- Implied third person — no "I" or "my"
- Strong precise vocabulary throughout
- Every sentence must earn its place — no filler
- Replace weak phrases: never "responsible for" → always "led", "delivered", "drove"`,
      "Professional": `
TONE: Professional (formal)
- Formal polished language — no slang, no contractions
- Implied third person — no "I" or "my"
- Strong precise vocabulary throughout
- Every sentence must earn its place — no filler
- Replace weak phrases: never "responsible for" → always "led", "delivered", "drove"`,

      "Academic": `
TONE: Academic
- Scholarly, measured, precise language
- Discipline-appropriate terminology where relevant
- No corporate buzzwords
- Passive and active voice mixed naturally as in academic writing
- Research and teaching descriptions should convey intellectual authority`,

      "Creative (story-driven)": `
TONE: Creative (story-driven)
- Summary reads as a compelling career narrative
- Vivid, specific, original language — no clichés
- Show personality while staying professional
- Experience descriptions tell a story of growth, challenge, impact
- The CV should feel human, not template-generated`,
      "Creative": `
TONE: Creative (story-driven)
- Summary reads as a compelling career narrative
- Vivid, specific, original language — no clichés
- Show personality while staying professional
- Experience descriptions tell a story of growth, challenge, impact
- The CV should feel human, not template-generated`,

      "Concise (short high-signal bullets)": `
TONE: Concise (high-signal bullets)
- Every line earns its place — remove all filler ruthlessly
- Bullets one line maximum
- Summary maximum 2 sentences
- Use numbers and metrics aggressively
- Remove: "responsible for", "worked closely with", "helped to", "assisted in"
- If it doesn't add signal, delete it`,
      "Concise": `
TONE: Concise (high-signal bullets)
- Every line earns its place — remove all filler ruthlessly
- Bullets one line maximum
- Summary maximum 2 sentences
- Use numbers and metrics aggressively
- Remove: "responsible for", "worked closely with", "helped to", "assisted in"
- If it doesn't add signal, delete it`,

      "Casual (Friendly and warm)": `
TONE: Casual (friendly and warm)
- Approachable, human, personable — still professional
- Contractions acceptable: I've, you'll, we delivered
- Show genuine enthusiasm and personality
- Avoid stiff corporate language
- Reader should feel like they're meeting a real person`,
      "Casual": `
TONE: Casual (friendly and warm)
- Approachable, human, personable — still professional
- Contractions acceptable: I've, you'll, we delivered
- Show genuine enthusiasm and personality
- Avoid stiff corporate language
- Reader should feel like they're meeting a real person`
    };

    const languageMap: Record<string, string> = {
      "UK English": `
LANGUAGE: British English throughout.
Spelling: programme, organise, colour, behaviour, centre, travelling, defence, catalogue.
Vocabulary: CV (not résumé), mobile (not cell), post (not mail), holiday (not vacation).`,
      "English (UK)": `
LANGUAGE: British English throughout.
Spelling: programme, organise, colour, behaviour, centre, travelling, defence, catalogue.
Vocabulary: CV (not résumé), mobile (not cell), post (not mail), holiday (not vacation).`,

      "US English": `
LANGUAGE: American English throughout.
Spelling: program, organize, color, behavior, center, traveling, defense, catalog.
Vocabulary: résumé (not CV), cell phone, mail, vacation.`,
      "English (US)": `
LANGUAGE: American English throughout.
Spelling: program, organize, color, behavior, center, traveling, defense, catalog.
Vocabulary: résumé (not CV), cell phone, mail, vacation.`,

      "French": `
LANGUAGE: Write the ENTIRE CV in French (Français). Formal register throughout.
Headers: "Expérience professionnelle", "Formation", "Compétences", "Langues", "Références disponibles sur demande".
Dates: janvier, février, mars etc. Full document in French — no English words.`,

      "German": `
LANGUAGE: Write the ENTIRE CV in German (Deutsch). Formal Sie-register throughout.
Headers: "Berufserfahrung", "Ausbildung", "Kenntnisse", "Sprachen", "Referenzen auf Anfrage".
Include DOB, nationality, marital status in header if user provided them.
Dates: DD.MM.YYYY format. Full document in German — no English words.`,

      "Spanish": `
LANGUAGE: Write the ENTIRE CV in Spanish (Español). Formal usted-register throughout.
Headers: "Experiencia profesional", "Formación académica", "Habilidades", "Idiomas", "Referencias disponibles bajo petición".
Dates: DD/MM/YYYY. Full document in Spanish — no English words.`
    };

    const formattingRules = `
FORMATTING RULES — never break these:

JOB HEADER — always one single line:
Job Title | Company Name | Location | Mon YYYY – Mon YYYY
Example: Data Analyst | Accenture | London, UK | Mar 2021 – Present
Example: Operations Manager | SheltercareFM | Lagos, Nigeria (Hybrid) | Jan 2019 – Aug 2022

NEVER:
- Put dates on a separate line
- Put location on a separate line
- Wrap dates or locations in asterisks (*text*)
- Use colored text markers
- Mix bullet styles — pick one and use it throughout

BULLETS:
- Use standard Markdown bullets (-) for every list item in the entire document
- Never use en-dashes (–) for bullets — use standard (-) only
- Every bullet starts with a strong action verb

DATES:
- Always inline, never isolated on their own line
- Format: Mon YYYY – Mon YYYY (Jan 2019 – Aug 2022)
- Current roles: Jan 2023 – Present
- Never style dates differently from surrounding text

SPACING:
- One blank line between each job role
- No blank line between job header and its bullets
- Consistent spacing throughout

OUTPUT:
- Plain text or clean markdown only
- No HTML tags
- No asterisk wrapping (*Lagos*)
- No special styling characters
- Section headers in ALL CAPS or **Bold**`;

    const cvTypeBlock = cvTypeRules[cvType || "Work CV"] || cvTypeRules["Work CV"];

    const systemPrompt = `You are a premium career coach and grant proposal writer for the PATHEW platform (rebranded as Pathew Assistant).
Your objective is to help the user prepare highly polished, custom, high-converting documents (CVs, Resumes, Cover Letters, or Grant/Fellowship Proposals).

${toneMap[tone || profile?.assistant_settings?.tone || 'Professional (formal)'] || toneMap['Professional (formal)']}

${languageMap[language || 'English (UK)'] || languageMap['English (UK)']}

${formattingRules}

Core Principles & Source Prioritization:
- You will receive multiple sources of truth (User Profile, Uploaded CVs/PDFs, LinkedIn data, Manual Notes). 
- PRIORITY 1: Uploaded CVs/PDFs (use as the major source of truth for exact dates and bullet points).
- PRIORITY 2: Manual Notes (use for specific context or custom requests).
- PRIORITY 3: Database Profile Data (use as the baseline core truth).
- Merge and deduplicate information intelligently across these sources.
- Strictly compare the user's background with the opportunity requirements. Identify real matches and gaps.
- Do not invent fake jobs or degrees, but DO extrapolate extensively on the theoretical coursework, transferable skills, and methodologies of the actual experiences provided to reach high word counts if requested.
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
- YOU MUST REACH THE TARGET PAGE COUNT — if the target is 4 pages, write 4 pages of content. Do not stop early.
- Apply the tone consistently from the first word to the last
- Write the entire CV in the specified language — no switching
- Output CV content only — no explanations, no commentary, no preamble
- Section headers should be in BOLD or ALL CAPS
- Never use asterisks to wrap text
- Never put dates or locations on their own line
- Use only (–) dash for all bullets throughout

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

CRITICAL: You MUST output your response in two distinct XML blocks: <draft> and <metadata>.
DO NOT wrap them in JSON or markdown blocks.

Output the full document text inside <draft>...</draft>.

Output the analytical metadata inside <metadata>...</metadata> as a raw JSON string matching this exact structure:
{
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
2. Populate the '<metadata>' block with actual matches ("strongMatches") and key mismatches/gaps ("gaps").
3. Determine if there is any crucial information missing to make this document high-converting. List these missing fields in the "missingFields" array within '<metadata>'. Limit to the 3-6 critical items (e.g. specific project metrics, target timelines, missing dates, or funder questions if not answered).
4. Inside the '<draft>...</draft>' tags, write a brief, friendly, professional summary (1-2 paragraphs) outlining what PATHEW has understood, what fits beautifully, and why we are asking for these missing details.`
    } else if (action && action.startsWith("regenerate:")) {
      const instructions = action.substring("regenerate:".length).trim();
      taskPrompt = `Task: Tailored Section Rewrite / Document Regeneration
Instructions:
1. Revise and rewrite the [Current Draft] according to the following user rewrite instructions: "${instructions}".
2. You must strictly apply the requested modification (for example, if asked to remove a contact field like LinkedIn, do not include it anywhere in the header or text of the updated draft).
3. Do not invent any untruths. Maintain the overall structure of the ${documentType || 'CV'} unless requested otherwise.
4. Keep the writing in the selected tone: ${tone || 'Professional & Academic'} and the target language: ${language || 'English (UK)'}.
5. Write the full updated document text directly inside the '<draft>...</draft>' tags. DO NOT output JSON for the draft.
6. Provide specific "editingSuggestions" based on the rewrite inside the '<metadata>' block.`
    } else {
      taskPrompt = `Task: High-Converting Document Generation
Instructions:
1. Write a complete, high-quality, tailored draft for the document type: ${documentType || 'CV'}.
2. Use all [USER BACKGROUND MATERIAL] (including all manual notes, achievements, and project notes) and incorporate the [USER ANSWERS TO GAPS / MISSING INFO] directly into the writing.
3. Tailor the content perfectly to match the [OPPORTUNITY REQUIREMENTS] without inventing any untruths.
4. Keep the writing in the selected tone: ${tone || 'Professional & Academic'} and the target language: ${language || 'English (UK)'}.
5. ${constraintsInstruction} Ensure the draft fits perfectly within these target limits.
6. Write the full text directly inside the '<draft>...</draft>' tags. DO NOT output JSON for the draft.
7. Provide specific "editingSuggestions" for improving the document further inside the '<metadata>' block.`
    }

    const userMessageContent = `
${contextPrompt}

${taskPrompt}
`

    const modelsToTry = [
      preferredModel, "claude-3-5-sonnet-20241022", "claude-3-5-sonnet-20240620",
      "claude-3-opus-20240229", "claude-3-haiku-20240307"
    ]
    const uniqueModels = [...new Set(modelsToTry)]

    for (const model of uniqueModels) {
      console.log(`[TRY] Model: ${model}`)
      const isSonnet = model.includes('sonnet');
      const maxTokens = isSonnet ? 8000 : 4096;
      try {
        const claudeResponse = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01',
          },
          body: JSON.stringify({
            model, max_tokens: maxTokens, system: systemPrompt,
            stream: true,
            messages: [{ role: "user", content: userMessageContent.trim() }],
          }),
        })

        if (claudeResponse.ok && claudeResponse.body) {
          const encoder = new TextEncoder()
          const decoder = new TextDecoder()
          
          const stream = new ReadableStream({
            async start(controller) {
              const reader = claudeResponse.body!.getReader()
              let buffer = ""
              let fullContent = ""
              
              try {
                while (true) {
                  const { done, value } = await reader.read()
                  if (done) break
                  
                  const chunk = decoder.decode(value, { stream: true })
                  buffer += chunk
                  const lines = buffer.split('\n')
                  buffer = lines.pop() || ""
                  
                  for (const line of lines) {
                    if (line.startsWith('data: ')) {
                      const data = line.substring(6)
                      if (data === '[DONE]') continue
                      try {
                        const event = JSON.parse(data)
                        if (event.type === 'content_block_delta' && event.delta?.text) {
                          const text = event.delta.text
                          fullContent += text
                          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'chunk', text })}\n\n`))
                        }
                      } catch (e) {
                         // ignore parse errors for partial JSON
                      }
                    }
                  }
                }
              } catch (err) {
                console.error('Stream read error:', err)
              }

              // After stream finishes, parse the content
              let draftContent = ""
              const draftMatch = fullContent.match(/<draft>([\s\S]*?)<\/draft>/)
              if (draftMatch) {
                draftContent = draftMatch[1].trim()
              } else {
                draftContent = fullContent.replace(/<metadata>[\s\S]*?<\/metadata>/, '').trim()
              }

              const metaMatch = fullContent.match(/<metadata>([\s\S]*?)<\/metadata>/)
              let parsedMetadata: any = {
                matchSummary: { strongMatches: [], gaps: [], priorityPoints: [] },
                missingFields: [], editingSuggestions: [], wordCountEstimate: draftContent.split(' ').length, confidence: 'low'
              }
              
              if (metaMatch) {
                try {
                  parsedMetadata = JSON.parse(metaMatch[1].trim())
                } catch (e) {
                  console.error("JSON parse error on metadata", e)
                }
              }
              parsedMetadata.draft = draftContent
              parsedMetadata.sessionId = sid

              // === DEDUCT CREDIT ===
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

              const tokensIn = 0 // Stream doesn't give this as easily, just record 0
              const tokensOut = 0

              const { error: userMsgError } = await supabaseAdmin.from('assistant_messages').insert({
                user_id: user.id,
                role: 'user',
                content: action === "extract_context" ? "Gap Analysis and Context Extraction" : `Draft Generation (${documentType})`,
                session_id: sid,
                tokens_in: tokensIn,
                tokens_out: 0,
              })
              if (userMsgError) console.error(`[HISTORY ERROR USER] ${userMsgError.message}`)

              const { error: asstMsgError } = await supabaseAdmin.from('assistant_messages').insert({
                user_id: user.id,
                role: 'assistant',
                content: draftContent,
                session_id: sid,
                tokens_in: 0,
                tokens_out: tokensOut,
              })
              if (asstMsgError) console.error(`[HISTORY ERROR ASST] ${asstMsgError.message}`)
              else console.log(`[HISTORY] Saved messages for session ${sid}`)

              parsedMetadata.creditsRemaining = newCredits
              parsedMetadata.creditsDeducted = creditCost

              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'done', metadata: parsedMetadata })}\n\n`))
              controller.close()
            }
          })

          return new Response(stream, {
            headers: { ...corsHeaders, 'Content-Type': 'text/event-stream' }
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

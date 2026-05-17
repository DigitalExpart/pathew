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
      language
    } = body

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
    const systemPrompt = `You are a premium career coach and grant proposal writer for the PATHEW platform.
Your objective is to help the user prepare highly polished, custom, high-converting documents (CVs, Resumes, Cover Letters, or Grant/Fellowship Proposals).
Selected Tone: ${tone || profile?.assistant_settings?.tone || 'Professional & Academic'}
Target Language: ${language || 'English (UK)'}

Tone Guidelines:
- Professional & Academic: formal, sophisticated, structured, and polished.
- Creative & Narrative: story-driven, expressive, and compelling.
- Concise & Impactful: direct, bulleted, action-oriented, and high-signal.
- Casual & Friendly: conversational, warm, and natural.

Language Guidelines:
- Write exclusively in the target language requested.
- If English (UK), use UK spelling (e.g. -ise, -our, -programme).
- If English (US), use US spelling (e.g. -ize, -or, -program).
- If any other language (Spanish, French, etc.), provide the ENTIRE response in that language.

Core Principles:
- Strictly compare the user's background with the opportunity requirements. Identify real matches and gaps.
- NEVER invent qualifications, experience, dates, or metrics. Be specific, but keep to the absolute truth of what is provided.
- Optimize the copy to maximize conversion (ATS optimization, impact metrics, narrative flow).

CRITICAL: Your ENTIRE response must be a valid JSON object with this exact structure. Do not put markdown wraps or "json" prefix blocks; output only the raw JSON.
{
  "draft": "Your detailed drafted document or summary here",
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
  "confidence": "high" | "medium" | "low"
}

If the user asks for a Roadmap or Preparation Plan, format the draft with clear "Week X:" headings on new lines.`

    // Layer 2: Context Prompt (compiles user profile, sources, target opportunity, and filled answers)
    let backgroundContextText = ""
    if (profile) {
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

    // Layer 3: Task Prompt (specifies the operation to execute)
    let taskPrompt = ""
    if (action === "extract_context") {
      taskPrompt = `Task: Extraction & Gap Analysis
Instructions:
1. Carefully read the [USER BACKGROUND MATERIAL] and compare it against the [OPPORTUNITY REQUIREMENTS].
2. Populate "matchSummary" with actual matches ("strongMatches") and key mismatches/gaps ("gaps").
3. Determine if there is any crucial information missing to make this document high-converting. List these missing fields in the "missingFields" array. Limit to the 2-4 most critical items (e.g. specific project metrics, target timelines, missing dates, or funder questions if not answered).
4. For the "draft" field, write a brief, friendly, professional summary (1-2 paragraphs) outlining what PATHEW has understood, what fits beautifully, and why we are asking for these missing details.`
    } else {
      taskPrompt = `Task: High-Converting Document Generation
Instructions:
1. Write a complete, high-quality, tailored draft for the document type: ${documentType || 'CV'}.
2. Use all [USER BACKGROUND MATERIAL] and incorporate the [USER ANSWERS TO GAPS / MISSING INFO] directly into the writing.
3. Tailor the content perfectly to match the [OPPORTUNITY REQUIREMENTS] without inventing any untruths.
4. Keep the writing in the selected tone: ${tone || 'Professional & Academic'} and the target language: ${language || 'English (UK)'}.
5. Write the full text directly in the "draft" field. Ensure it is detailed, comprehensive, and ready for use.
6. Provide specific "editingSuggestions" for improving the document further.`
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
            model, max_tokens: 2048, system: systemPrompt,
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
            parsedResponse = {
              draft: content,
              matchSummary: { strongMatches: [], gaps: [], priorityPoints: [] },
              missingFields: [],
              editingSuggestions: [],
              wordCountEstimate: content.split(' ').length,
              confidence: 'medium',
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

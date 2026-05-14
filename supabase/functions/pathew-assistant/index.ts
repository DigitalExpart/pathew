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
    const { action, sessionId, documentType, currentDraft } = body

    const { data: profile } = await supabaseClient
      .from('profiles').select('*').eq('id', user.id).maybeSingle()

    // Credit check
    const currentCredits = profile?.credits ?? 0
    if (currentCredits < 1) {
      return new Response(JSON.stringify({ 
        error: 'Insufficient credits. Please upgrade your plan.',
        draft: 'You do not have enough credits to use the Assistant. Please top up your account.',
        matchSummary: { strongMatches: [], gaps: [], priorityPoints: [] },
        editingSuggestions: [], wordCountEstimate: 0, confidence: 'low', sessionId: sessionId || 'error'
      }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
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

    const systemPrompt = `You are a premium career coach for the PATHEW platform.
Provide high-quality, actionable career advice and document drafts.
User context: ${userContext}

CRITICAL: Your ENTIRE response must be a valid JSON object with this exact structure (no markdown, no code blocks, just raw JSON):
{"draft": "Your detailed response here", "matchSummary": {"strongMatches": ["point1"], "gaps": ["gap1"], "priorityPoints": ["tip1"]}, "editingSuggestions": ["suggestion1"], "wordCountEstimate": 300, "confidence": "high", "sessionId": "${sid}"}`

    const userMessageContent = `
Task / Action: ${action || "How can I improve my profile?"}
Document Type: ${documentType || 'General'}
Current Draft Content to Review/Rewrite:
${currentDraft || '(No current draft provided)'}
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
            const cleanJson = content.replace(/```json\n?|```\n?/g, '').trim()
            parsedResponse = JSON.parse(cleanJson)
          } catch {
            parsedResponse = {
              draft: content,
              matchSummary: { strongMatches: [], gaps: [], priorityPoints: [] },
              editingSuggestions: [],
              wordCountEstimate: content.split(' ').length,
              confidence: 'medium',
              sessionId: sid
            }
          }

          // === DEDUCT 1 CREDIT ===
          const newCredits = Math.max(0, currentCredits - 1)
          const { error: creditError } = await supabaseAdmin.from('profiles').update({ credits: newCredits }).eq('id', user.id)
          if (creditError) console.error(`[CREDIT ERROR] ${creditError.message}`)
          else console.log(`[CREDITS] ${currentCredits} -> ${newCredits} for user ${user.id}`)

          // === SAVE TO HISTORY ===
          // 1. Create the session first to satisfy the foreign key constraint
          if (!sessionId) {
            const { error: sessionError } = await supabaseAdmin.from('assistant_sessions').insert({
              id: sid,
              user_id: user.id,
              task: action.length > 50 ? action.substring(0, 50) + '...' : action,
              page: documentType || 'General'
            })
            if (sessionError) console.error(`[HISTORY ERROR SESSION] ${sessionError.message}`)
          }

          // 2. Save user message
          const { error: userMsgError } = await supabaseAdmin.from('assistant_messages').insert({
            user_id: user.id,
            role: 'user',
            content: action,
            session_id: sid,
            tokens_in: tokensIn,
            tokens_out: 0,
          })
          if (userMsgError) console.error(`[HISTORY ERROR USER] ${userMsgError.message}`)

          // 3. Save assistant response
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

          // Add credits info to response
          parsedResponse.creditsRemaining = newCredits
          parsedResponse.creditsDeducted = 1

          return new Response(JSON.stringify(parsedResponse), {
            status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          })
        }

        const errBody = await claudeResponse.text()
        console.log(`[FAIL] ${model}: ${claudeResponse.status}`)

      } catch (fetchErr) {
        console.log(`[ERROR] ${model}: ${fetchErr.message}`)
      }
    }

    console.error('[FAILED] No models available')
    return new Response(JSON.stringify({
      draft: "AI service is temporarily unavailable. No credits were deducted.",
      matchSummary: { strongMatches: [], gaps: [], priorityPoints: [] },
      editingSuggestions: [], wordCountEstimate: 0, confidence: 'low', sessionId: sid
    }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('[FATAL]', error.message)
    return new Response(JSON.stringify({
      draft: "Sorry, something went wrong. No credits were deducted.",
      matchSummary: { strongMatches: [], gaps: [], priorityPoints: [] },
      editingSuggestions: [], wordCountEstimate: 0, confidence: 'low', sessionId: 'error'
    }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})

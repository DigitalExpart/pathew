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

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    )

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser()
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const body = await req.json()
    const { action, sessionId } = body

    const { data: profile } = await supabaseClient
      .from('profiles').select('*').eq('id', user.id).maybeSingle()

    const userContext = profile
      ? `Name: ${profile.full_name || 'Unknown'}, Plan: ${profile.subscription_plan || 'Free'}`
      : `Email: ${user.email}`

    const apiKey = Deno.env.get('ANTHROPIC_API_KEY')
    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'AI not configured' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Use env var for model, fallback to claude-sonnet-4-5
    const preferredModel = Deno.env.get('CLAUDE_MODEL') || 'claude-sonnet-4-5'
    const sid = sessionId || 'session-' + Date.now()

    const systemPrompt = `You are a premium career coach for the PATHEW platform.
Provide high-quality, actionable career advice and document drafts.
User context: ${userContext}

CRITICAL: Your ENTIRE response must be a valid JSON object with this exact structure (no markdown, no code blocks, just raw JSON):
{"draft": "Your detailed response here", "matchSummary": {"strongMatches": ["point1"], "gaps": ["gap1"], "priorityPoints": ["tip1"]}, "editingSuggestions": ["suggestion1"], "wordCountEstimate": 300, "confidence": "high", "sessionId": "${sid}"}`

    // Models available on this account (from Anthropic dashboard)
    const modelsToTry = [
      preferredModel,
      "claude-sonnet-4-5",
      "claude-sonnet-4-6",
      "claude-opus-4-5",
      "claude-opus-4-6",
      "claude-opus-4-7",
      "claude-opus-4-1",
    ]

    // Remove duplicates
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
            model: model,
            max_tokens: 2048,
            system: systemPrompt,
            messages: [{ role: "user", content: action || "How can I improve my profile?" }],
          }),
        })

        if (claudeResponse.ok) {
          const result = await claudeResponse.json()
          const content = result.content?.[0]?.text || ''
          console.log(`[SUCCESS] Model ${model} responded!`)

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
      draft: "AI service is temporarily unavailable. Please try again shortly.",
      matchSummary: { strongMatches: [], gaps: [], priorityPoints: [] },
      editingSuggestions: [], wordCountEstimate: 0, confidence: 'low', sessionId: sid
    }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('[FATAL]', error.message)
    return new Response(JSON.stringify({
      draft: "Sorry, something went wrong. Please try again.",
      matchSummary: { strongMatches: [], gaps: [], priorityPoints: [] },
      editingSuggestions: [], wordCountEstimate: 0, confidence: 'low', sessionId: 'error'
    }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})

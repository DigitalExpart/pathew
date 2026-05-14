import { createClient } from "npm:@supabase/supabase-js@2.45.0"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    // 1. Auth check
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

    console.log(`[INFO] User: ${user.id}`)

    const body = await req.json()
    const { action, sessionId } = body

    // 2. Fetch profile
    const { data: profile } = await supabaseClient
      .from('profiles').select('*').eq('id', user.id).maybeSingle()

    const userContext = profile
      ? `Name: ${profile.full_name || 'Unknown'}, Plan: ${profile.subscription_plan || 'Free'}`
      : `Email: ${user.email}`

    // 3. Check API key
    const apiKey = Deno.env.get('ANTHROPIC_API_KEY')
    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'AI not configured' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // 4. Call Claude API directly via HTTP (bypasses old SDK issues)
    const sid = sessionId || 'session-' + Date.now()
    const systemPrompt = `You are a premium career coach for the PATHEW platform.
Provide high-quality, actionable career advice and document drafts.
User context: ${userContext}

CRITICAL: Your ENTIRE response must be a valid JSON object with this exact structure (no markdown, no code blocks, just raw JSON):
{"draft": "Your detailed response here", "matchSummary": {"strongMatches": ["point1"], "gaps": ["gap1"], "priorityPoints": ["tip1"]}, "editingSuggestions": ["suggestion1"], "wordCountEstimate": 300, "confidence": "high", "sessionId": "${sid}"}`

    // Try multiple model names in order of preference
    const modelsToTry = [
      "claude-sonnet-4-20250514",
      "claude-3-7-sonnet-20250219",
      "claude-3-5-sonnet-20241022",
      "claude-3-5-sonnet-20240620",
      "claude-3-sonnet-20240229",
    ]

    let lastError = null

    for (const model of modelsToTry) {
      console.log(`[INFO] Trying model: ${model}`)
      
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
          console.log(`[SUCCESS] Model ${model} worked!`)

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

        const errorData = await claudeResponse.json()
        lastError = errorData
        console.log(`[WARN] Model ${model} failed: ${JSON.stringify(errorData)}`)
        continue

      } catch (fetchErr) {
        lastError = fetchErr
        console.log(`[WARN] Model ${model} fetch error: ${fetchErr.message}`)
        continue
      }
    }

    // All models failed
    console.error(`[ERROR] All models failed. Last error:`, lastError)
    return new Response(JSON.stringify({
      draft: "I'm temporarily unable to connect to the AI service. Please try again in a moment.",
      matchSummary: { strongMatches: [], gaps: [], priorityPoints: [] },
      editingSuggestions: [],
      wordCountEstimate: 0,
      confidence: 'low',
      sessionId: sid,
      error: 'All AI models unavailable. Last error: ' + JSON.stringify(lastError)
    }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('[FATAL]', error.message)
    return new Response(JSON.stringify({
      draft: "Sorry, something went wrong. Please try again.",
      matchSummary: { strongMatches: [], gaps: [], priorityPoints: [] },
      editingSuggestions: [],
      wordCountEstimate: 0,
      confidence: 'low',
      sessionId: 'error'
    }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})

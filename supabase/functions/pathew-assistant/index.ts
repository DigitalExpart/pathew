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

    const sid = sessionId || 'session-' + Date.now()
    const systemPrompt = `You are a premium career coach for the PATHEW platform.
Provide high-quality, actionable career advice and document drafts.
User context: ${userContext}

CRITICAL: Your ENTIRE response must be a valid JSON object with this exact structure (no markdown, no code blocks, just raw JSON):
{"draft": "Your detailed response here", "matchSummary": {"strongMatches": ["point1"], "gaps": ["gap1"], "priorityPoints": ["tip1"]}, "editingSuggestions": ["suggestion1"], "wordCountEstimate": 300, "confidence": "high", "sessionId": "${sid}"}`

    // Step 1: Try to discover available models
    const apiVersions = ['2025-01-01', '2024-10-22', '2023-06-01']
    
    for (const apiVersion of apiVersions) {
      console.log(`[INFO] Trying to list models with API version: ${apiVersion}`)
      try {
        const modelsRes = await fetch('https://api.anthropic.com/v1/models', {
          headers: {
            'x-api-key': apiKey,
            'anthropic-version': apiVersion,
          },
        })
        if (modelsRes.ok) {
          const modelsData = await modelsRes.json()
          console.log(`[INFO] Available models: ${JSON.stringify(modelsData)}`)
        } else {
          const errText = await modelsRes.text()
          console.log(`[INFO] Models endpoint (${apiVersion}): ${modelsRes.status} - ${errText}`)
        }
      } catch (e) {
        console.log(`[INFO] Models endpoint error: ${e.message}`)
      }
    }

    // Step 2: Try all possible model names with different API versions
    const modelsToTry = [
      // Claude 4 family (2025+)
      "claude-sonnet-4-20250514",
      "claude-4-sonnet-20250514",
      "claude-haiku-4-20250514",
      "claude-4-haiku-20250514",
      "claude-opus-4-20250514",
      // Aliases / latest
      "claude-sonnet-latest",
      "claude-haiku-latest", 
      "claude-opus-latest",
      // Claude 3.7
      "claude-3-7-sonnet-20250219",
      "claude-3-7-sonnet-latest",
      // Claude 3.5
      "claude-3-5-sonnet-20241022",
      "claude-3-5-haiku-20241022",
      "claude-3-5-sonnet-20240620",
      // Claude 3
      "claude-3-sonnet-20240229",
      "claude-3-haiku-20240307",
      "claude-3-opus-20240229",
    ]

    let lastError = null

    for (const model of modelsToTry) {
      for (const apiVersion of apiVersions) {
        try {
          console.log(`[TRY] ${model} with version ${apiVersion}`)
          
          const claudeResponse = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-api-key': apiKey,
              'anthropic-version': apiVersion,
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
            console.log(`[SUCCESS] Model: ${model}, API Version: ${apiVersion}`)

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
          lastError = `${model}@${apiVersion}: ${claudeResponse.status} ${errBody}`
          
          // If it's not a 404 (model not found), log it differently
          if (claudeResponse.status !== 404) {
            console.log(`[UNEXPECTED] ${model}@${apiVersion}: status ${claudeResponse.status} - ${errBody}`)
          }

        } catch (fetchErr) {
          lastError = `${model}@${apiVersion}: ${fetchErr.message}`
        }
      }
    }

    console.error(`[FAILED] All models failed. Last: ${lastError}`)
    return new Response(JSON.stringify({
      draft: "I'm temporarily unable to connect. Please try again shortly.",
      matchSummary: { strongMatches: [], gaps: [], priorityPoints: [] },
      editingSuggestions: [],
      wordCountEstimate: 0,
      confidence: 'low',
      sessionId: sid,
      error: lastError
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

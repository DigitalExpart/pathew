import { createClient } from "npm:@supabase/supabase-js@2.45.0"
import Anthropic from "npm:@anthropic-ai/sdk@0.27.1"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const authHeader = req.headers.get('Authorization')
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader || '' } } }
    )

    const { data: { user } } = await supabaseClient.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    const body = await req.json()
    const { action, sessionId } = body

    const { data: profile } = await supabaseClient.from('profiles').select('*').eq('id', user.id).single()

    const anthropic = new Anthropic({
      apiKey: Deno.env.get('ANTHROPIC_API_KEY'),
    })

    console.log(`[DEBUG] Attempting Claude request for user ${user.id}`)

    try {
      const response = await anthropic.messages.create({
        model: "claude-3-5-sonnet-20240620",
        max_tokens: 2048,
        system: `You are a premium career coach and document specialist for the PATHEW platform. 
        Your goal is to provide high-quality career advice and document drafts.
        IMPORTANT: Your entire response must be a valid JSON object with the following structure:
        {
          "draft": "The main content or document generated",
          "matchSummary": {
            "strongMatches": ["Point 1", "Point 2"],
            "gaps": ["Gap 1"],
            "priorityPoints": ["Suggestion 1"]
          },
          "editingSuggestions": ["Suggestion A", "Suggestion B"],
          "wordCountEstimate": 500,
          "confidence": "high",
          "sessionId": "${sessionId || 'default'}"
        }`,
        messages: [{ role: "user", content: `Action: ${action}. User Profile: ${JSON.stringify(profile)}` }],
      })

      const content = response.content[0].type === 'text' ? response.content[0].text : ''
      
      // Clean the content in case Claude adds markdown code blocks
      const cleanJson = content.replace(/```json|```/g, '').trim();
      const parsedResponse = JSON.parse(cleanJson)

      return new Response(JSON.stringify(parsedResponse), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    } catch (apiError) {
      console.error('[ANTHROPIC API ERROR]', apiError)
      return new Response(JSON.stringify({ error: apiError.message }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

  } catch (error) {
    console.error('[SERVER ERROR]', error.message)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})

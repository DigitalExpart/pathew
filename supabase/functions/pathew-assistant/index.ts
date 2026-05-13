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
        model: "claude-2.1",
        max_tokens: 1024,
        system: `You are a career coach. Respond in JSON: {"draft": "text", "matchSummary": "text", "editingSuggestions": []}. User: ${JSON.stringify(profile)}`,
        messages: [{ role: "user", content: action }],
      })

      const content = response.content[0].type === 'text' ? response.content[0].text : ''
      const parsedResponse = JSON.parse(content)

      return new Response(JSON.stringify(parsedResponse), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    } catch (apiError) {
      console.error('[ANTHROPIC API ERROR]', JSON.stringify(apiError, null, 2))
      throw apiError
    }

  } catch (error) {
    console.error('[SERVER ERROR]', error.message)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})

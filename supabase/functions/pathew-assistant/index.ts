import { createClient } from "npm:@supabase/supabase-js@2.45.0"
import Anthropic from "npm:@anthropic-ai/sdk@0.27.1"

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
      return new Response(JSON.stringify({ error: 'No authorization header provided' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    )

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser()
    if (authError || !user) {
      console.error('[AUTH ERROR]', authError?.message)
      return new Response(JSON.stringify({ error: 'Unauthorized: ' + (authError?.message || 'No user found') }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    console.log(`[INFO] User authenticated: ${user.id}`)

    // 2. Parse request body
    const body = await req.json()
    const { action, sessionId } = body
    console.log(`[INFO] Action: ${action}`)

    // 3. Fetch profile (don't crash if missing)
    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle()

    if (profileError) {
      console.error('[PROFILE ERROR]', profileError.message)
    }

    const userContext = profile 
      ? `Name: ${profile.full_name || 'Unknown'}, Plan: ${profile.subscription_plan || 'Free'}` 
      : `Email: ${user.email}`

    // 4. Check API key exists
    const apiKey = Deno.env.get('ANTHROPIC_API_KEY')
    if (!apiKey) {
      console.error('[CONFIG ERROR] ANTHROPIC_API_KEY not set')
      return new Response(JSON.stringify({ error: 'AI service not configured. Please contact support.' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // 5. Call Claude
    const anthropic = new Anthropic({ apiKey })

    console.log(`[INFO] Calling Claude API...`)

    const response = await anthropic.messages.create({
      model: "claude-3-haiku-20240307",
      max_tokens: 2048,
      system: `You are a premium career coach for the PATHEW platform. 
Provide high-quality, actionable career advice and document drafts.
User context: ${userContext}

CRITICAL: Your ENTIRE response must be a valid JSON object with this exact structure (no markdown, no code blocks, just raw JSON):
{"draft": "Your detailed response here", "matchSummary": {"strongMatches": ["point1"], "gaps": ["gap1"], "priorityPoints": ["tip1"]}, "editingSuggestions": ["suggestion1"], "wordCountEstimate": 300, "confidence": "high", "sessionId": "${sessionId || 'session-' + Date.now()}"}`,
      messages: [{ role: "user", content: action || "How can I improve my profile?" }],
    })

    console.log(`[INFO] Claude responded successfully`)

    const content = response.content[0].type === 'text' ? response.content[0].text : ''
    
    // Try to parse as JSON, with fallback
    let parsedResponse
    try {
      const cleanJson = content.replace(/```json\n?|```\n?/g, '').trim()
      parsedResponse = JSON.parse(cleanJson)
    } catch {
      // If Claude didn't return valid JSON, wrap the response
      parsedResponse = {
        draft: content,
        matchSummary: { strongMatches: [], gaps: [], priorityPoints: [] },
        editingSuggestions: [],
        wordCountEstimate: content.split(' ').length,
        confidence: 'medium',
        sessionId: sessionId || 'session-' + Date.now()
      }
    }

    return new Response(JSON.stringify(parsedResponse), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('[FATAL ERROR]', error.message, error.stack)
    return new Response(JSON.stringify({ 
      error: error.message || 'Internal server error',
      draft: "I'm sorry, I encountered a temporary issue. Please try again in a moment.",
      matchSummary: { strongMatches: [], gaps: [], priorityPoints: [] },
      editingSuggestions: [],
      wordCountEstimate: 0,
      confidence: 'low',
      sessionId: 'error-session'
    }), {
      status: 200, // Return 200 so the frontend doesn't crash
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})

// @ts-nocheck
import { createClient } from "npm:@supabase/supabase-js@2.45.0"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // SECURITY: Verify the caller is authenticated and is an admin
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'No authorization header' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Create a user-context client to verify identity
    const supabaseUser = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    )

    const { data: { user }, error: authError } = await supabaseUser.auth.getUser()
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Create admin client for privileged operations
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // SECURITY: Verify the user has admin/sub_admin role
    const { data: callerProfile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profileError || !callerProfile || !['admin', 'sub_admin'].includes(callerProfile.role)) {
      return new Response(JSON.stringify({ error: 'Forbidden: Admin access required' }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const { action, updateData, userId } = await req.json()

    if (action === 'get_all_users') {
      const { data, error } = await supabaseAdmin
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error

      return new Response(JSON.stringify({ users: data }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    }
    
    if (action === 'update_user' && userId && updateData) {
      // SECURITY: Prevent role escalation — sub_admins cannot create other admins
      if (updateData.role && callerProfile.role !== 'admin') {
        return new Response(JSON.stringify({ error: 'Only full admins can change user roles' }), {
          status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      const { error } = await supabaseAdmin
        .from('profiles')
        .update(updateData)
        .eq('id', userId)
        
      if (error) throw error
      
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    }

    if (action === 'get_ai_usage') {
      const [sessRes, msgRes, recentRes] = await Promise.all([
        supabaseAdmin.from('assistant_sessions').select('id', { count: 'exact', head: true }),
        supabaseAdmin.from('assistant_messages').select('tokens_in, tokens_out, user_id'),
        supabaseAdmin.from('assistant_messages').select('id, created_at, role, content, user_id').order('created_at', { ascending: false }).limit(50)
      ])

      return new Response(JSON.stringify({ 
        sessionsCount: sessRes.count, 
        messages: msgRes.data, 
        recent: recentRes.data 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    }

    throw new Error('Invalid action')

  } catch (error: any) {
    console.error('Error:', error.message)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})

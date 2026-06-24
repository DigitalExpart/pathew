// @ts-nocheck
import Stripe from "https://esm.sh/stripe@12.0.0?target=deno"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.105.4"

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', {
  httpClient: Stripe.createFetchHttpClient(),
})

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// SECURITY: Server-side price map — client CANNOT override these values
const PLAN_CONFIG = {
  'Starter':    { amount: 1199, credits: 5 },
  'Growth':     { amount: 2500, credits: 15 },
  'Power User': { amount: 4800, credits: 40 },
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // SECURITY: Verify the caller is authenticated
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Authentication required' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

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

    const { plan, couponId } = await req.json()

    // SECURITY: Only accept plan name — look up amount server-side
    const planConfig = PLAN_CONFIG[plan]
    if (!planConfig) {
      return new Response(JSON.stringify({ error: `Invalid plan: ${plan}` }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    let amount = planConfig.amount

    // If a coupon was provided, validate it server-side
    if (couponId) {
      const supabaseAdmin = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      )

      const { data: coupon, error: couponError } = await supabaseAdmin
        .from('coupons')
        .select('*')
        .eq('id', couponId)
        .single()

      if (!couponError && coupon && coupon.is_active) {
        // Check usage limits
        const withinLimit = !coupon.max_uses || (coupon.current_uses || 0) < coupon.max_uses
        // Check expiry
        const notExpired = !coupon.expires_at || new Date(coupon.expires_at) > new Date()

        if (withinLimit && notExpired) {
          if (coupon.discount_type === 'percentage') {
            amount = Math.round(amount * (1 - coupon.discount_value / 100))
          } else if (coupon.discount_type === 'fixed') {
            amount = Math.max(0, amount - Math.round(coupon.discount_value * 100))
          }
        }
      }
    }

    // Ensure minimum charge
    if (amount < 50) amount = 50 // Stripe minimum is 50 pence/cents

    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: 'gbp',
      automatic_payment_methods: { enabled: true },
      metadata: {
        plan,
        user_id: user.id,
        credits: planConfig.credits.toString(),
      },
    })

    return new Response(
      JSON.stringify({ clientSecret: paymentIntent.client_secret }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})

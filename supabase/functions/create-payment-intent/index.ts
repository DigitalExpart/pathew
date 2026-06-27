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

    const { plan, couponId, paymentMethodId } = await req.json()
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

    // Fetch stripe customer id to attach
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('stripe_customer_id, full_name')
      .eq('id', user.id)
      .single()

    let customerId = profile?.stripe_customer_id

    // If no customer, create one
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: profile?.full_name || '',
        metadata: { supabase_user_id: user.id }
      })
      customerId = customer.id
      
      await supabaseAdmin
        .from('profiles')
        .update({ stripe_customer_id: customerId })
        .eq('id', user.id)
    }

    const paymentIntentParams: any = {
      amount,
      currency: 'gbp',
      customer: customerId,
      metadata: {
        plan,
        user_id: user.id,
        credits: planConfig.credits.toString(),
      },
    };

    if (paymentMethodId) {
      paymentIntentParams.payment_method = paymentMethodId;
      paymentIntentParams.confirm = true; // Attempt to confirm immediately if using saved method
      paymentIntentParams.automatic_payment_methods = { enabled: true, allow_redirects: 'never' };
      // Note: We'll set a return_url in frontend if redirect is needed, but 'never' prevents redirect-based methods here. Wait, actually we can just use normal automatic payment methods without confirm=true, and let the frontend confirm it with the payment element. But if we already have the payment method, we can just pass it.
      // Better yet, just pass payment_method and let the frontend use confirmCardPayment or confirmPayment.
      // Actually, if we pass payment_method to PaymentIntent create, we don't need automatic_payment_methods.
      delete paymentIntentParams.automatic_payment_methods;
    } else {
      paymentIntentParams.automatic_payment_methods = { enabled: true };
      paymentIntentParams.setup_future_usage = 'off_session'; // Automatically save the new card for future use
    }

    const paymentIntent = await stripe.paymentIntents.create(paymentIntentParams)

    return new Response(
      JSON.stringify({ 
        clientSecret: paymentIntent.client_secret,
        status: paymentIntent.status // Could be 'succeeded' or 'requires_action' if confirm=true
      }),
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

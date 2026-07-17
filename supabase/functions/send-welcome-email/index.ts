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
    const BREVO_API_KEY = Deno.env.get('BREVO_API_KEY');
    if (!BREVO_API_KEY) {
      throw new Error('BREVO_API_KEY is not set in edge function environment variables');
    }

    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
    if (!RESEND_API_KEY) {
      throw new Error('RESEND_API_KEY is not set in edge function environment variables');
    }

    // The payload from Supabase Database Webhooks
    const payload = await req.json();

    // Check if it's an INSERT operation on the profiles table
    if (payload.type !== 'INSERT' || !payload.record) {
      return new Response(JSON.stringify({ message: 'Not an insert event, ignoring' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    const { id: userId, email, full_name } = payload.record;
    
    if (!email) {
      return new Response(JSON.stringify({ message: 'No email found in record, ignoring' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    // Initialize Supabase Admin Client to fetch user metadata from auth.users
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Fetch the auth.users record to get marketing_consent
    const { data: { user }, error: userError } = await supabaseAdmin.auth.admin.getUserById(userId);
    const marketingConsent = user?.user_metadata?.marketing_consent === true;

    // 1. If marketingConsent is true, add to Brevo Contact List
    if (marketingConsent) {
      const BREVO_LIST_ID = Deno.env.get('BREVO_LIST_ID'); 
      if (BREVO_LIST_ID) {
        const listIds = [parseInt(BREVO_LIST_ID)];
        try {
          const contactRes = await fetch('https://api.brevo.com/v3/contacts', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'api-key': BREVO_API_KEY,
            },
            body: JSON.stringify({
              email: email,
              attributes: {
                FIRSTNAME: full_name ? full_name.split(' ')[0] : '',
                LASTNAME: full_name ? full_name.split(' ').slice(1).join(' ') : ''
              },
              listIds: listIds,
              updateEnabled: true
            }),
          });
          if (!contactRes.ok) {
            console.error('Failed to add contact to Brevo list:', await contactRes.text());
          }
        } catch (contactErr) {
          console.error('Error adding contact to Brevo:', contactErr);
        }
      }
    }

    // 2. Send the Welcome Email
    const firstName = full_name ? full_name.split(' ')[0] : 'there';

    const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333; line-height: 1.6;">
      <h2 style="color: #0f172a;">Welcome to Pathew!</h2>
      <p>Hi ${firstName},</p>
      
      <p>We're excited to have you join us.</p>
      
      <p>With your Pathew account, you can:</p>
      <ul style="margin-left: 20px;">
        <li style="margin-bottom: 8px;">Build high-quality CVs and cover letters</li>
        <li style="margin-bottom: 8px;">Discover verified jobs, grants, scholarships, and opportunities</li>
        <li style="margin-bottom: 8px;">Earn and use credits for premium AI features</li>
        <li style="margin-bottom: 8px;">Stay updated with the latest opportunities and career insights</li>
      </ul>
      
      <p>To get started (see links below):</p>
      <ol style="margin-left: 20px;">
        <li style="margin-bottom: 8px;"><a href="https://pathew.extraordinarywomanblog.com/profile" style="color: #f59e0b; text-decoration: none; font-weight: bold;">Complete your profile</a>.</li>
        <li style="margin-bottom: 8px;"><a href="https://pathew.extraordinarywomanblog.com/opportunities" style="color: #f59e0b; text-decoration: none; font-weight: bold;">Explore available opportunities</a>.</li>
        <li style="margin-bottom: 8px;"><a href="https://pathew.extraordinarywomanblog.com/pricing" style="color: #f59e0b; text-decoration: none; font-weight: bold;">Top up your credits</a> whenever you need access to premium AI tools.</li>
      </ol>
      
      <p>If you ever need help, simply reply to this email—we're always happy to assist.</p>
      
      <p>Thank you for choosing Pathew.<br>
      We're excited to be part of your journey.</p>
      
      <p style="margin-top: 30px;">Warm regards,<br>
      <strong>The Pathew Team</strong></p>
    </div>
    `;

    // Send the email via Resend
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'Pathew Team <hello@pathew.extraordinarywomanblog.com>',
        to: email,
        subject: 'Welcome to Pathew!',
        html: htmlContent,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      console.error('Error sending email:', data);
      throw new Error(`Resend API returned error: ${JSON.stringify(data)}`);
    }

    return new Response(JSON.stringify({ success: true, data }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error: any) {
    console.error('Error in send-welcome-email:', error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});

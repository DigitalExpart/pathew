-- 1. Add email column to profiles if it doesn't exist
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email text;

-- 2. Update the profile creation trigger to capture the email
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    -- Create profile with email and 1 free credit
    BEGIN
        INSERT INTO public.profiles (id, email, full_name, avatar_url, credits, role)
        VALUES (
            NEW.id,
            NEW.email,
            COALESCE(NEW.raw_user_meta_data->>'full_name', 'New User'), 
            NEW.raw_user_meta_data->>'avatar_url', 
            1, 
            'user'
        );
    EXCEPTION WHEN OTHERS THEN
        RAISE LOG 'Profile creation failed for user %: %', NEW.id, SQLERRM;
    END;

    -- Log transaction for the free credit
    BEGIN
        INSERT INTO public.transactions (user_id, type, amount, description)
        VALUES (NEW.id, 'credit', 1, 'Welcome Bonus: Account Creation');
    EXCEPTION WHEN OTHERS THEN
        RAISE LOG 'Transaction creation failed for user %: %', NEW.id, SQLERRM;
    END;

    -- Create Welcome notification
    BEGIN
        INSERT INTO public.notifications (user_id, title, description, type)
        VALUES (NEW.id, 'Welcome to PATHEW!', 'Welcome aboard! We have gifted you 1 free credit to help you get started on your journey.', 'system');
    EXCEPTION WHEN OTHERS THEN
        RAISE LOG 'Notification creation failed for user %: %', NEW.id, SQLERRM;
    END;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Put the Webhook Trigger back on public.profiles!
-- First, recreate the webhook function to pull from the new email column
create or replace function public.send_welcome_email_webhook()
returns trigger as $$
declare
  req_id bigint;
begin
  select
    net.http_post(
      url:='https://ialvtdpugkvnkznzbyde.supabase.co/functions/v1/send-welcome-email',
      headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlhbHZ0ZHB1Z2t2bmt6bnpieWRlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgyNzM4NTIsImV4cCI6MjA5Mzg0OTg1Mn0.MSeGrYGi8k2RJ4xJnx43sSkcBxHfUWckuqF8OmUs6yQ"}'::jsonb,
      body:=json_build_object(
        'type', 'INSERT',
        'table', TG_TABLE_NAME,
        'schema', TG_TABLE_SCHEMA,
        'record', row_to_json(NEW)
      )::jsonb
    ) into req_id;

  return NEW;
end;
$$ language plpgsql security definer;

-- Remove the broken trigger from auth.users
drop trigger if exists welcome_email_trigger on auth.users;

-- Recreate the trigger on public.profiles
drop trigger if exists welcome_email_trigger on public.profiles;
create trigger welcome_email_trigger
after insert on public.profiles
for each row execute function public.send_welcome_email_webhook();

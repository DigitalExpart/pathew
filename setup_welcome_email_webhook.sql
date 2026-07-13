-- Enable pg_net if not already enabled
create extension if not exists pg_net with schema extensions;

-- Create the trigger function
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
        'record', json_build_object(
          'email', NEW.email,
          'full_name', NEW.raw_user_meta_data->>'full_name'
        )
      )::jsonb
    ) into req_id;

  return NEW;
end;
$$ language plpgsql security definer;

-- Remove the old trigger from public.profiles
drop trigger if exists welcome_email_trigger on public.profiles;

-- Create the trigger on auth.users instead!
drop trigger if exists welcome_email_trigger on auth.users;
create trigger welcome_email_trigger
after insert on auth.users
for each row execute function public.send_welcome_email_webhook();

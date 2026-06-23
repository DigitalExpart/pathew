-- RUN THIS IN YOUR SUPABASE SQL EDITOR TO MAKE THE TRIGGER BULLETPROOF

-- Drop existing trigger to be safe
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create the bulletproof function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    -- 1. Create profile with 1 free credit. 
    -- We use an exception block just in case of any weird conflicts so it doesn't break signups
    BEGIN
        INSERT INTO public.profiles (id, full_name, avatar_url, credits, role)
        VALUES (
            NEW.id, 
            COALESCE(NEW.raw_user_meta_data->>'full_name', 'New User'), 
            NEW.raw_user_meta_data->>'avatar_url', 
            1, 
            'user'
        );
    EXCEPTION WHEN OTHERS THEN
        -- If profile insertion fails, we log it but don't abort the signup
        RAISE LOG 'Profile creation failed for user %: %', NEW.id, SQLERRM;
    END;

    -- 2. Log transaction for the free credit
    BEGIN
        INSERT INTO public.transactions (user_id, type, amount, description)
        VALUES (NEW.id, 'credit', 1, 'Welcome Bonus: Account Creation');
    EXCEPTION WHEN OTHERS THEN
        RAISE LOG 'Transaction creation failed for user %: %', NEW.id, SQLERRM;
    END;

    -- 3. Create Welcome notification
    BEGIN
        INSERT INTO public.notifications (user_id, title, description, type)
        VALUES (NEW.id, 'Welcome to PATHEW!', 'Welcome aboard! We have gifted you 1 free credit to help you get started on your journey.', 'system');
    EXCEPTION WHEN OTHERS THEN
        RAISE LOG 'Notification creation failed for user %: %', NEW.id, SQLERRM;
    END;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- SYNC MISSING PROFILES (Like your admin account)
-- This creates a profile, credit, and notification for any auth.users that are missing from the profiles table!
DO $$ 
DECLARE
  missing_user RECORD;
BEGIN
  FOR missing_user IN 
    SELECT id, raw_user_meta_data FROM auth.users WHERE id NOT IN (SELECT id FROM public.profiles)
  LOOP
    INSERT INTO public.profiles (id, full_name, credits, role)
    VALUES (missing_user.id, COALESCE(missing_user.raw_user_meta_data->>'full_name', 'Admin User'), 1, 'user');
    
    INSERT INTO public.transactions (user_id, type, amount, description)
    VALUES (missing_user.id, 'credit', 1, 'Welcome Bonus: Account Recovery');

    INSERT INTO public.notifications (user_id, title, description, type)
    VALUES (missing_user.id, 'Welcome to PATHEW!', 'Welcome aboard! We have gifted you 1 free credit.', 'system');
  END LOOP;
END $$;

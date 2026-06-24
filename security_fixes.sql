-- ============================================================
-- PATHEW Security Fixes & Updates — Run in Supabase SQL Editor
-- ============================================================

-- FIX H1: Add 'admin' to the profiles role CHECK constraint
-- This allows the role-based admin auth system to work properly
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE profiles ADD CONSTRAINT profiles_role_check 
  CHECK (role IN ('user', 'sub_admin', 'admin'));

-- FIX M2: Fix Opportunities RLS — stop leaking other users' saved items
-- Before: status = 'Saved' let anyone see other users' saved opportunities
-- After: Only show published items to everyone, saved items only to the owner
DROP POLICY IF EXISTS "Anyone can read published opportunities" ON opportunities;
CREATE POLICY "Anyone can read published opportunities" ON opportunities
  FOR SELECT TO authenticated 
  USING (status = 'published' OR user_id = auth.uid() OR created_by = auth.uid());


-- FEATURE: 1 Free Credit & Welcome Notification for New Users
-- This updates the trigger that runs when a user signs up.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    -- Create profile with 1 free credit
    INSERT INTO public.profiles (id, full_name, avatar_url, credits)
    VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'avatar_url', 1);

    -- Log transaction
    INSERT INTO public.transactions (user_id, type, amount, description)
    VALUES (NEW.id, 'credit', 1, 'Welcome Bonus: Account Creation');

    -- Create notification
    INSERT INTO public.notifications (user_id, title, description, type)
    VALUES (NEW.id, 'Welcome to PATHEW!', 'Welcome aboard! We have gifted you 1 free credit to help you get started on your journey.', 'system');

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- FIX H2: Credit deduction atomicity
-- Use an RPC to decrement credits so it's safe against race conditions.
CREATE OR REPLACE FUNCTION public.decrement_credits(user_id UUID, amount INTEGER)
RETURNS INTEGER AS $$
DECLARE
  current_credits INTEGER;
BEGIN
  -- Row-level lock to prevent concurrent modifications
  SELECT credits INTO current_credits FROM public.profiles WHERE id = user_id FOR UPDATE;

  IF current_credits < amount THEN
    RAISE EXCEPTION 'Insufficient credits';
  END IF;

  UPDATE public.profiles SET credits = credits - amount WHERE id = user_id;
  
  RETURN current_credits - amount;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Verify: List all tables with RLS status
-- SELECT schemaname, tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public';

-- FEATURE: Add published column to reviews for unpublish functionality
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS published BOOLEAN DEFAULT true;

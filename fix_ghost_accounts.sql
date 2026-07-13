-- 1. Create a function to automatically delete the Auth User when a Profile is deleted
CREATE OR REPLACE FUNCTION public.handle_deleted_profile()
RETURNS TRIGGER AS $$
BEGIN
    -- This deletes the user from the hidden auth.users table
    DELETE FROM auth.users WHERE id = OLD.id;
    RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Attach the trigger to the profiles table
DROP TRIGGER IF EXISTS on_profile_deleted ON public.profiles;
CREATE TRIGGER on_profile_deleted
  AFTER DELETE ON public.profiles
  FOR EACH ROW EXECUTE PROCEDURE public.handle_deleted_profile();

-- 3. Clean up the "ghost" accounts you already deleted from the profiles table!
-- This will delete any account in auth.users that no longer has a profile.
DELETE FROM auth.users WHERE id NOT IN (SELECT id FROM public.profiles);

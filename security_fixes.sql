-- ============================================================
-- PATHEW Security Fixes — Run in Supabase SQL Editor
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

-- Verify: List all tables with RLS status
-- SELECT schemaname, tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public';

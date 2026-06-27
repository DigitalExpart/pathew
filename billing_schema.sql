-- 1. Add stripe_customer_id to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;

-- 2. Create billing_history table
CREATE TABLE IF NOT EXISTS billing_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  amount INTEGER NOT NULL,
  currency TEXT DEFAULT 'gbp',
  status TEXT DEFAULT 'succeeded',
  description TEXT,
  stripe_payment_intent_id TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Enable RLS
ALTER TABLE billing_history ENABLE ROW LEVEL SECURITY;

-- 4. Create Policies for billing_history
DROP POLICY IF EXISTS "Users can view their own billing history" ON billing_history;
CREATE POLICY "Users can view their own billing history"
  ON billing_history FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);
  
DROP POLICY IF EXISTS "Service role can insert billing history" ON billing_history;
CREATE POLICY "Service role can insert billing history"
  ON billing_history FOR INSERT
  TO service_role
  WITH CHECK (true);

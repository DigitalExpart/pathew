-- PATHEW System Schema

-- 0. Profiles Table (Core User Data)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  avatar_url TEXT,
  credits INTEGER DEFAULT 100,
  story TEXT,
  education JSONB DEFAULT '[]',
  experience JSONB DEFAULT '[]',
  goals JSONB DEFAULT '[]',
  achievements JSONB DEFAULT '[]',
  projects JSONB DEFAULT '[]',
  organisation TEXT,
  portfolio_url TEXT,
  skills JSONB DEFAULT '[]',
  portfolios JSONB DEFAULT '[]',
  notification_settings JSONB DEFAULT '{"email": true, "push": true, "newsletter": false}',
  assistant_settings JSONB DEFAULT '{"tone": "Professional & Academic", "language": "English (UK)", "autoSave": true}',
  marketing_preferences JSONB DEFAULT '{"opportunityAlerts": true, "productUpdates": true}',
  subscription_plan TEXT DEFAULT 'Free',
  role TEXT DEFAULT 'user' CHECK (role IN ('user', 'sub_admin')),
  renewal_date TIMESTAMPTZ,
  payment_method JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 1. Assistant Sessions
CREATE TABLE IF NOT EXISTS assistant_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  page TEXT NOT NULL,
  task TEXT NOT NULL,
  document_type TEXT,
  opportunity_id UUID,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Assistant Messages
CREATE TABLE IF NOT EXISTS assistant_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES assistant_sessions(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role TEXT CHECK (role IN ('user', 'assistant', 'system')) NOT NULL,
  content TEXT NOT NULL,
  request_json JSONB,
  response_json JSONB,
  model TEXT,
  tokens_in INTEGER,
  tokens_out INTEGER,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Assistant Drafts
CREATE TABLE IF NOT EXISTS assistant_drafts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  session_id UUID REFERENCES assistant_sessions(id) ON DELETE SET NULL,
  document_type TEXT NOT NULL,
  opportunity_id UUID,
  section_key TEXT,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  version INTEGER DEFAULT 1,
  is_current BOOLEAN DEFAULT true,
  source_message_id UUID REFERENCES assistant_messages(id) ON DELETE SET NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Notifications
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  type TEXT CHECK (type IN ('opportunity', 'system', 'message', 'achievement')) NOT NULL,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE assistant_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE assistant_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE assistant_drafts ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Policies for profiles
DROP POLICY IF EXISTS "Users can manage their own profile" ON profiles;
CREATE POLICY "Users can manage their own profile"
  ON profiles FOR ALL
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Policies for assistant_sessions
DROP POLICY IF EXISTS "Users can manage their own assistant sessions" ON assistant_sessions;
CREATE POLICY "Users can manage their own assistant sessions"
  ON assistant_sessions FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policies for assistant_messages
DROP POLICY IF EXISTS "Users can manage their own assistant messages" ON assistant_messages;
CREATE POLICY "Users can manage their own assistant messages"
  ON assistant_messages FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policies for assistant_drafts
DROP POLICY IF EXISTS "Users can manage their own assistant drafts" ON assistant_drafts;
CREATE POLICY "Users can manage their own assistant drafts"
  ON assistant_drafts FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policies for notifications
DROP POLICY IF EXISTS "Users can manage their own notifications" ON notifications;
CREATE POLICY "Users can manage their own notifications"
  ON notifications FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Helper to update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON profiles
FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

DROP TRIGGER IF EXISTS update_assistant_sessions_updated_at ON assistant_sessions;
CREATE TRIGGER update_assistant_sessions_updated_at
BEFORE UPDATE ON assistant_sessions
FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

DROP TRIGGER IF EXISTS update_assistant_drafts_updated_at ON assistant_drafts;
CREATE TRIGGER update_assistant_drafts_updated_at
BEFORE UPDATE ON assistant_drafts
FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- Trigger to create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, full_name, avatar_url)
    VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'avatar_url');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

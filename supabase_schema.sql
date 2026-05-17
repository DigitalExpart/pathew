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

-- 5. Profile Sources (uploaded CVs, linkedin URLs, raw_text, parsed_json)
CREATE TABLE IF NOT EXISTS profile_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  source_type TEXT CHECK (source_type IN ('uploaded_cv', 'linkedin', 'manual_notes', 'pathew_profile', 'pasted_text')) NOT NULL,
  source_url TEXT,
  file_name TEXT,
  file_type TEXT,
  raw_text TEXT,
  parsed_json JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 6. Opportunities (Extended definition for consistency if not exists)
CREATE TABLE IF NOT EXISTS opportunities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- for user-saved opportunities
  title TEXT NOT NULL,
  description TEXT,
  requirements JSONB DEFAULT '[]',
  skills JSONB DEFAULT '[]',
  location TEXT,
  apply_link TEXT,
  type TEXT CHECK (type IN ('job', 'grant', 'fellowship', 'scholarship', 'other')) NOT NULL,
  status TEXT DEFAULT 'draft',
  source_name TEXT,
  source_url TEXT,
  original_url TEXT,
  deadline TEXT,
  featured BOOLEAN DEFAULT false,
  tags JSONB DEFAULT '[]',
  work_mode TEXT,
  salary TEXT,
  salary_currency TEXT,
  salary_period TEXT,
  employment_type TEXT,
  experience_level TEXT,
  organization_name TEXT,
  amount TEXT,
  amount_currency TEXT,
  duration TEXT,
  eligibility_criteria TEXT,
  funder_name TEXT,
  target_region TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 7. Builder Requests
CREATE TABLE IF NOT EXISTS builder_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  builder_type TEXT CHECK (builder_type IN ('cv', 'cover_letter', 'grant')) NOT NULL,
  task TEXT NOT NULL,
  document_type TEXT,
  opportunity_id UUID REFERENCES opportunities(id) ON DELETE SET NULL,
  source_ids UUID[] DEFAULT '{}',
  current_text TEXT,
  user_prompt TEXT,
  word_limit INTEGER,
  page_count INTEGER,
  tone_preference TEXT,
  preferred_language TEXT,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 8. Generated Documents (stores actual content drafts and versions)
CREATE TABLE IF NOT EXISTS generated_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  builder_request_id UUID REFERENCES builder_requests(id) ON DELETE SET NULL,
  document_type TEXT NOT NULL, -- 'CV' | 'Cover Letter' | 'Grant Proposal' | 'Fellowship Application'
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  structured_json JSONB DEFAULT '{}',
  version INTEGER DEFAULT 1,
  is_current BOOLEAN DEFAULT true,
  opportunity_id UUID REFERENCES opportunities(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 9. User Settings (Unified settings extending profiles settings if needed)
CREATE TABLE IF NOT EXISTS user_settings (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  tone_preference TEXT DEFAULT 'Professional & Academic',
  preferred_language TEXT DEFAULT 'English (UK)',
  ai_enabled BOOLEAN DEFAULT true,
  region TEXT,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE profile_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE builder_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE generated_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

-- Policies
DROP POLICY IF EXISTS "Users can manage their own profile sources" ON profile_sources;
CREATE POLICY "Users can manage their own profile sources" ON profile_sources
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Anyone can read published opportunities" ON opportunities;
CREATE POLICY "Anyone can read published opportunities" ON opportunities
  FOR SELECT TO authenticated USING (status = 'published' OR status = 'Saved' OR user_id = auth.uid());

DROP POLICY IF EXISTS "Users can manage their own opportunities" ON opportunities;
CREATE POLICY "Users can manage their own opportunities" ON opportunities
  FOR ALL TO authenticated USING (user_id = auth.uid() OR created_by = auth.uid()) WITH CHECK (user_id = auth.uid() OR created_by = auth.uid());

DROP POLICY IF EXISTS "Users can manage their own builder requests" ON builder_requests;
CREATE POLICY "Users can manage their own builder requests" ON builder_requests
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage their own generated documents" ON generated_documents;
CREATE POLICY "Users can manage their own generated documents" ON generated_documents
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage their own settings" ON user_settings;
CREATE POLICY "Users can manage their own settings" ON user_settings
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Triggers for updated_at
DROP TRIGGER IF EXISTS update_opportunities_updated_at ON opportunities;
DROP TRIGGER IF EXISTS update_builder_requests_updated_at ON builder_requests;
DROP TRIGGER IF EXISTS update_generated_documents_updated_at ON generated_documents;
DROP TRIGGER IF EXISTS update_user_settings_updated_at ON user_settings;

CREATE TRIGGER update_opportunities_updated_at BEFORE UPDATE ON opportunities FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_builder_requests_updated_at BEFORE UPDATE ON builder_requests FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_generated_documents_updated_at BEFORE UPDATE ON generated_documents FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_user_settings_updated_at BEFORE UPDATE ON user_settings FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

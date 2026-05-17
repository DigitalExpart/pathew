-- ============================================================
-- PATHEW AI-FIRST BUILDER TABLES — Paste this in Supabase SQL Editor
-- ============================================================

-- 0. Helper function for auto-updating updated_at (skip if already exists)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- 1. PROFILE SOURCES — stores uploaded CVs, LinkedIn, notes
-- ============================================================
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

ALTER TABLE profile_sources ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their own profile sources" ON profile_sources;
CREATE POLICY "Users can manage their own profile sources" ON profile_sources
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- 2. BUILDER REQUESTS — logs generation parameters
-- ============================================================
CREATE TABLE IF NOT EXISTS builder_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  builder_type TEXT CHECK (builder_type IN ('cv', 'cover_letter', 'grant')) NOT NULL,
  task TEXT NOT NULL,
  document_type TEXT,
  opportunity_id UUID,
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

ALTER TABLE builder_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their own builder requests" ON builder_requests;
CREATE POLICY "Users can manage their own builder requests" ON builder_requests
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER update_builder_requests_updated_at
  BEFORE UPDATE ON builder_requests
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- ============================================================
-- 3. GENERATED DOCUMENTS — versioned drafts storage
-- ============================================================
CREATE TABLE IF NOT EXISTS generated_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  builder_request_id UUID REFERENCES builder_requests(id) ON DELETE SET NULL,
  document_type TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  structured_json JSONB DEFAULT '{}',
  version INTEGER DEFAULT 1,
  is_current BOOLEAN DEFAULT true,
  opportunity_id UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE generated_documents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their own generated documents" ON generated_documents;
CREATE POLICY "Users can manage their own generated documents" ON generated_documents
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER update_generated_documents_updated_at
  BEFORE UPDATE ON generated_documents
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- ============================================================
-- 4. USER SETTINGS — tone, language, preferences
-- ============================================================
CREATE TABLE IF NOT EXISTS user_settings (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  tone_preference TEXT DEFAULT 'Professional & Academic',
  preferred_language TEXT DEFAULT 'English (UK)',
  ai_enabled BOOLEAN DEFAULT true,
  region TEXT,
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their own settings" ON user_settings;
CREATE POLICY "Users can manage their own settings" ON user_settings
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER update_user_settings_updated_at
  BEFORE UPDATE ON user_settings
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- ============================================================
-- 5. STORAGE BUCKET — for uploaded CV files
-- ============================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('profile-documents', 'profile-documents', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies: users can upload/read/delete their own files
DROP POLICY IF EXISTS "Users can upload their own documents" ON storage.objects;
CREATE POLICY "Users can upload their own documents" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'profile-documents' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "Users can read their own documents" ON storage.objects;
CREATE POLICY "Users can read their own documents" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'profile-documents' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "Users can delete their own documents" ON storage.objects;
CREATE POLICY "Users can delete their own documents" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'profile-documents' AND (storage.foldername(name))[1] = auth.uid()::text);

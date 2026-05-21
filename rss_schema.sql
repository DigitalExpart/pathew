-- RSS Integration Schema
-- 1. Create rss_sources table
CREATE TABLE IF NOT EXISTS rss_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  website_url TEXT,
  feed_url TEXT NOT NULL,
  enabled BOOLEAN DEFAULT true,
  sync_interval_hours INTEGER DEFAULT 24,
  last_sync_at TIMESTAMPTZ,
  last_sync_status TEXT CHECK (last_sync_status IN ('success', 'error', 'syncing')),
  last_sync_error TEXT,
  items_imported INTEGER DEFAULT 0,
  classification_rules JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Create rss_sync_logs table
CREATE TABLE IF NOT EXISTS rss_sync_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id UUID REFERENCES rss_sources(id) ON DELETE CASCADE,
  started_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ,
  status TEXT CHECK (status IN ('success', 'error', 'running')),
  items_found INTEGER DEFAULT 0,
  items_new INTEGER DEFAULT 0,
  items_updated INTEGER DEFAULT 0,
  items_skipped INTEGER DEFAULT 0,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Extend opportunities table with RSS metadata
ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS rss_guid TEXT;
ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS rss_source_id UUID REFERENCES rss_sources(id) ON DELETE SET NULL;
ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS rss_imported_at TIMESTAMPTZ;
ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS thumbnail_url TEXT;

-- 4. Unique constraint for deduplication
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'opportunities_rss_guid_key'
  ) THEN
    ALTER TABLE opportunities ADD CONSTRAINT opportunities_rss_guid_key UNIQUE (rss_guid);
  END IF;
END $$;

-- 5. Enable RLS and setup policies
ALTER TABLE rss_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE rss_sync_logs ENABLE ROW LEVEL SECURITY;

-- Note: In a typical setup, rss tables are only accessed by admin users or service role
DROP POLICY IF EXISTS "Admins can manage rss sources" ON rss_sources;
CREATE POLICY "Admins can manage rss sources" ON rss_sources
  FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'sub_admin'))
  );

DROP POLICY IF EXISTS "Admins can manage rss sync logs" ON rss_sync_logs;
CREATE POLICY "Admins can manage rss sync logs" ON rss_sync_logs
  FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'sub_admin'))
  );

-- 6. Trigger for updated_at
DROP TRIGGER IF EXISTS update_rss_sources_updated_at ON rss_sources;
CREATE TRIGGER update_rss_sources_updated_at BEFORE UPDATE ON rss_sources FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

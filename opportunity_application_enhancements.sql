-- ============================================================
-- PATHEW Opportunity Applications Table Schema Enhancements
-- Run this in Supabase SQL Editor to add full attachment columns
-- ============================================================

ALTER TABLE public.opportunity_applications 
  ADD COLUMN IF NOT EXISTS attached_documents JSONB DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS profile_attached BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS media_urls JSONB DEFAULT '[]';

-- Verify table schema columns
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'opportunity_applications';

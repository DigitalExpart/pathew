-- ====================================================================
-- PATHEW SCHEMA EXTENSION (V2) — Run this in Supabase SQL Editor
-- ====================================================================

-- 1. Extend Profiles table with billing details (Step 1 checkout compulsory requirements)
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS billing_completed BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS billing_info JSONB DEFAULT '{
  "company_name": "",
  "vat_number": "",
  "address_line1": "",
  "address_line2": "",
  "city": "",
  "state_province": "",
  "postal_code": "",
  "country": "",
  "phone_number": ""
}'::jsonb;

-- 2. Extend Builder Requests with manual notes, custom questions and builder-specific inputs
ALTER TABLE public.builder_requests 
ADD COLUMN IF NOT EXISTS manual_notes JSONB DEFAULT '{
  "custom_question_notes": "",
  "leadership_achievements": "",
  "project_notes": "",
  "additional_context": ""
}'::jsonb,
ADD COLUMN IF NOT EXISTS custom_questions JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS career_gap BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS career_gap_explanation TEXT,
ADD COLUMN IF NOT EXISTS experience_level TEXT,
ADD COLUMN IF NOT EXISTS cv_type TEXT,
ADD COLUMN IF NOT EXISTS application_stage TEXT,
ADD COLUMN IF NOT EXISTS project_anchor TEXT,
ADD COLUMN IF NOT EXISTS funder_values TEXT,
ADD COLUMN IF NOT EXISTS previous_app_history JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS partners JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS reporting_methods JSONB DEFAULT '[]'::jsonb;

-- 3. Extend Generated Documents with same metadata for versioning history
ALTER TABLE public.generated_documents 
ADD COLUMN IF NOT EXISTS manual_notes JSONB DEFAULT '{
  "custom_question_notes": "",
  "leadership_achievements": "",
  "project_notes": "",
  "additional_context": ""
}'::jsonb,
ADD COLUMN IF NOT EXISTS custom_questions JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS career_gap BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS career_gap_explanation TEXT,
ADD COLUMN IF NOT EXISTS experience_level TEXT,
ADD COLUMN IF NOT EXISTS cv_type TEXT,
ADD COLUMN IF NOT EXISTS application_stage TEXT,
ADD COLUMN IF NOT EXISTS project_anchor TEXT,
ADD COLUMN IF NOT EXISTS funder_values TEXT,
ADD COLUMN IF NOT EXISTS previous_app_history JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS partners JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS reporting_methods JSONB DEFAULT '[]'::jsonb;

RAISE NOTICE 'PATHEW Database Schema version 2 successfully extended!';

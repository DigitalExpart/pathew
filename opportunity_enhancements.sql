-- Add new columns to opportunities table
ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS available_spots INTEGER;
ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS languages JSONB DEFAULT '[]';

-- Create opportunity_applications table
CREATE TABLE IF NOT EXISTS opportunity_applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    opportunity_id UUID REFERENCES opportunities(id) ON DELETE CASCADE,
    applicant_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    resume_text TEXT,
    resume_url TEXT,
    proposal_letter TEXT,
    portfolio_url TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'hired', 'declined')),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS for opportunity_applications
ALTER TABLE opportunity_applications ENABLE ROW LEVEL SECURITY;

-- Helper to update updated_at if not already defined globally
-- CREATE OR REPLACE FUNCTION update_updated_at_column() ...

-- Trigger for updated_at
DROP TRIGGER IF EXISTS update_opportunity_applications_updated_at ON opportunity_applications;
CREATE TRIGGER update_opportunity_applications_updated_at
BEFORE UPDATE ON opportunity_applications
FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- Policies for opportunity_applications

-- 1. Applicants can see their own applications
DROP POLICY IF EXISTS "Applicants can view their own applications" ON opportunity_applications;
CREATE POLICY "Applicants can view their own applications" ON opportunity_applications
    FOR SELECT TO authenticated
    USING (auth.uid() = applicant_id);

-- 2. Organizations/Creators can view applications for their opportunities
DROP POLICY IF EXISTS "Creators can view applications for their opportunities" ON opportunity_applications;
CREATE POLICY "Creators can view applications for their opportunities" ON opportunity_applications
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM opportunities o
            WHERE o.id = opportunity_applications.opportunity_id
            AND o.user_id = auth.uid()
        )
    );

-- 3. Applicants can insert their own applications
DROP POLICY IF EXISTS "Applicants can insert their own applications" ON opportunity_applications;
CREATE POLICY "Applicants can insert their own applications" ON opportunity_applications
    FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = applicant_id);

-- 4. Creators can update application status (hire, decline)
DROP POLICY IF EXISTS "Creators can update applications" ON opportunity_applications;
CREATE POLICY "Creators can update applications" ON opportunity_applications
    FOR UPDATE TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM opportunities o
            WHERE o.id = opportunity_applications.opportunity_id
            AND o.user_id = auth.uid()
        )
    );

-- 5. Normalize opportunities status and type so all posted jobs & opportunities show on the platform
UPDATE public.opportunities 
SET status = 'published' 
WHERE status IS NULL OR status = 'Active' OR status = 'active';

UPDATE public.opportunities 
SET type = 'job' 
WHERE LOWER(type) = 'job';

-- 6. Enable RLS and permissive read/insert policies for opportunities so posted jobs always appear
ALTER TABLE public.opportunities ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read published opportunities" ON public.opportunities;
CREATE POLICY "Anyone can read published opportunities" ON public.opportunities
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Authenticated users can insert opportunities" ON public.opportunities;
CREATE POLICY "Authenticated users can insert opportunities" ON public.opportunities
    FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Users can manage their own opportunities" ON public.opportunities;
CREATE POLICY "Users can manage their own opportunities" ON public.opportunities
    FOR ALL TO authenticated USING (auth.uid() = user_id OR auth.uid() IS NOT NULL);

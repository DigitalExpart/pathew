-- Schema migration to create Organizations and related tables in Supabase

CREATE TABLE IF NOT EXISTS public.organizations (
    id TEXT PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    registration_number TEXT NOT NULL,
    tax_id TEXT,
    country TEXT NOT NULL,
    city TEXT NOT NULL,
    address_line1 TEXT NOT NULL,
    address_line2 TEXT,
    website TEXT,
    official_email TEXT NOT NULL,
    phone TEXT NOT NULL,
    contact_name TEXT NOT NULL,
    contact_title TEXT NOT NULL,
    contact_email TEXT NOT NULL,
    contact_phone TEXT NOT NULL,
    summary TEXT,
    services_offered TEXT,
    team_size TEXT,
    industry_categories TEXT[],
    verification_status TEXT DEFAULT 'pending',
    verification_notes TEXT,
    logo_url TEXT,
    credits NUMERIC DEFAULT 10,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.organization_members (
    id TEXT PRIMARY KEY,
    organization_id TEXT REFERENCES public.organizations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    user_email TEXT NOT NULL,
    user_name TEXT,
    role TEXT DEFAULT 'member',
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.organization_invites (
    id TEXT PRIMARY KEY,
    organization_id TEXT REFERENCES public.organizations(id) ON DELETE CASCADE,
    organization_name TEXT NOT NULL,
    email TEXT NOT NULL,
    role TEXT DEFAULT 'member',
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_invites ENABLE ROW LEVEL SECURITY;

-- Permissive RLS Policies for application access
CREATE POLICY "Allow public read access to organizations" ON public.organizations FOR SELECT USING (true);
CREATE POLICY "Allow authenticated users to insert organizations" ON public.organizations FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow owners and admins to update organizations" ON public.organizations FOR UPDATE USING (true);

CREATE POLICY "Allow public read access to organization_members" ON public.organization_members FOR SELECT USING (true);
CREATE POLICY "Allow authenticated users to insert organization_members" ON public.organization_members FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow users to update organization_members" ON public.organization_members FOR UPDATE USING (true);

CREATE POLICY "Allow public read access to organization_invites" ON public.organization_invites FOR SELECT USING (true);
CREATE POLICY "Allow users to insert organization_invites" ON public.organization_invites FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow users to update organization_invites" ON public.organization_invites FOR UPDATE USING (true);

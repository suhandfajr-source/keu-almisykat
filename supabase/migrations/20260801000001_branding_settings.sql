-- ====================================================================
-- SUPABASE MIGRATION: BRANDING & APP SETTINGS SETUP
-- Pondok Pesantren Al-Misykat Al-Islami
-- ====================================================================

-- 1. Create app_settings Table
CREATE TABLE IF NOT EXISTS public.app_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key TEXT NOT NULL UNIQUE,
    value TEXT NOT NULL DEFAULT '',
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_app_settings_key ON public.app_settings(key);

-- 2. Enable RLS on app_settings
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

-- Allow public / authenticated users to read settings
CREATE POLICY "Allow public read on app_settings"
ON public.app_settings FOR SELECT
TO public, authenticated, anon
USING (TRUE);

-- Allow authenticated users to insert / update / delete settings
CREATE POLICY "Allow authenticated full access on app_settings"
ON public.app_settings FOR ALL
TO authenticated
USING (TRUE)
WITH CHECK (TRUE);

-- 3. Create app-branding Storage Bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'app-branding',
    'app-branding',
    TRUE,
    5242880, -- 5MB
    ARRAY['image/jpeg', 'image/png', 'image/jpg', 'image/svg+xml', 'image/webp']
)
ON CONFLICT (id) DO UPDATE
SET 
    public = TRUE,
    file_size_limit = 5242880,
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/jpg', 'image/svg+xml', 'image/webp'];

-- 4. Storage Policies for app-branding Bucket
DROP POLICY IF EXISTS "Public view for app-branding" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload branding" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update branding" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete branding" ON storage.objects;

CREATE POLICY "Public view for app-branding"
ON storage.objects FOR SELECT
TO public, anon, authenticated
USING (bucket_id = 'app-branding');

CREATE POLICY "Authenticated users can upload branding"
ON storage.objects FOR INSERT
TO authenticated, anon, public
WITH CHECK (bucket_id = 'app-branding');

CREATE POLICY "Authenticated users can update branding"
ON storage.objects FOR UPDATE
TO authenticated, anon, public
USING (bucket_id = 'app-branding')
WITH CHECK (bucket_id = 'app-branding');

CREATE POLICY "Authenticated users can delete branding"
ON storage.objects FOR DELETE
TO authenticated, anon, public
USING (bucket_id = 'app-branding');

-- 5. Seed default branding identity
INSERT INTO public.app_settings (key, value)
VALUES 
    ('app_name', 'Al-Misykat'),
    ('app_subtitle', 'Keuangan Pesantren')
ON CONFLICT (key) DO NOTHING;

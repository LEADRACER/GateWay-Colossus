-- 0007: Platform settings persistence (admin/settings page)
-- Key/value store; admins write, everyone reads.

CREATE TABLE IF NOT EXISTS public.site_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now(),
  updated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_site_settings_key ON public.site_settings(key);

ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

-- Settings viewable by everyone (public display values live here: site name/tagline)
DROP POLICY IF EXISTS "Settings viewable by everyone" ON public.site_settings;
CREATE POLICY "Settings viewable by everyone" ON public.site_settings FOR SELECT USING (true);

-- Admins can manage settings
DROP POLICY IF EXISTS "Admins can manage settings" ON public.site_settings;
CREATE POLICY "Admins can manage settings" ON public.site_settings FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

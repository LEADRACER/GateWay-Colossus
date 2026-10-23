-- 0010: platform API bug-fix schema
-- (missing tables referenced by live code + RLS glue)

-- ── permission_requests (admin permissions page + request-permission flow) ──
CREATE TABLE IF NOT EXISTS public.permission_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','denied')),
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_permission_requests_user ON public.permission_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_permission_requests_status ON public.permission_requests(status);

ALTER TABLE public.permission_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users view own permission requests" ON public.permission_requests;
CREATE POLICY "Users view own permission requests" ON public.permission_requests
  FOR SELECT USING (user_id = auth.uid()::uuid);

-- Admins can view all + manage (status changes, approve grants)
DROP POLICY IF EXISTS "Admins manage permission requests" ON public.permission_requests;
CREATE POLICY "Admins manage permission requests" ON public.permission_requests
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Users can create their own request
DROP POLICY IF EXISTS "Users create own permission requests" ON public.permission_requests;
CREATE POLICY "Users create own permission requests" ON public.permission_requests
  FOR INSERT WITH CHECK (user_id = auth.uid()::uuid);

-- ── sync_jobs (admin moderation "sync" flow logs) ──────────────────────────
CREATE TABLE IF NOT EXISTS public.sync_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  sync_type text NOT NULL DEFAULT 'github_sync',
  status text NOT NULL DEFAULT 'completed' CHECK (status IN ('completed','failed')),
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_sync_jobs_created ON public.sync_jobs(created_at DESC);

ALTER TABLE public.sync_jobs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can log own syncs" ON public.sync_jobs;
CREATE POLICY "Authenticated users can log own syncs" ON public.sync_jobs
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Admins can read all syncs" ON public.sync_jobs;
CREATE POLICY "Admins can read all syncs" ON public.sync_jobs
  FOR SELECT USING (
    user_id = auth.uid()::uuid
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ── profiles insert policy (request-permission self-provisioning path) ─────
DROP POLICY IF EXISTS "Users can create own profile" ON public.profiles;
CREATE POLICY "Users can create own profile" ON public.profiles
  FOR INSERT WITH CHECK (id = auth.uid()::uuid);

-- ── API key lookup helper (public /api/v1 endpoints) ───────────────────────
-- api_keys RLS is owner-only by design, but the v1 routes authenticate with a
-- bearer key via anon-key clients (no user cookie) — a SECURITY DEFINER pair
-- lets the lookup + last_used touch work without weakening the table.
CREATE OR REPLACE FUNCTION public.lookup_api_key(p_hash TEXT)
RETURNS TABLE (key_id uuid, key_user_id uuid, key_name text, key_scopes text[], key_rate_limit integer, key_expires_at timestamptz)
SECURITY DEFINER SET search_path = public
STABLE
AS $$
  SELECT id, user_id, name, scopes, rate_limit, expires_at
  FROM api_keys
  WHERE key_hash = p_hash AND is_active = true
  LIMIT 1;
$$ LANGUAGE sql;

CREATE OR REPLACE FUNCTION public.touch_api_key(p_key_id uuid)
RETURNS void
SECURITY DEFINER SET search_path = public
AS $$
  UPDATE api_keys SET last_used_at = now() WHERE id = p_key_id;
$$ LANGUAGE sql;

GRANT EXECUTE ON FUNCTION public.lookup_api_key(TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.touch_api_key(uuid) TO anon, authenticated;

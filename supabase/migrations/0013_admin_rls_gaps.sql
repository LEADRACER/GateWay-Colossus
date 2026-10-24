-- 0013 — admin RLS gaps + public showcase reads + api key expiry
-- 2026-10-24

-- 1) Admins can update other users' profiles (role changes, can_add_projects
--    grants, permission-request approvals). Without this, every admin
--    UPDATE on another user's row silently affected 0 rows.
DROP POLICY IF EXISTS "Admins can update profiles" ON public.profiles;
CREATE POLICY "Admins can update profiles" ON public.profiles
  FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  )
  WITH CHECK (true);

-- 2) Approved showcases are public data — the public terminal feed reads
--    showcase_requests under the visitor's JWT, so everyone except the
--    requester and admins saw an empty flag map.
DROP POLICY IF EXISTS "Approved showcases are public" ON public.showcase_requests;
CREATE POLICY "Approved showcases are public" ON public.showcase_requests
  FOR SELECT USING (status = 'approved');

-- 3) Expired API keys must not authenticate. lookup_api_key checked only
--    key_hash and is_active.
CREATE OR REPLACE FUNCTION public.lookup_api_key(p_hash TEXT)
RETURNS TABLE (
  key_id UUID,
  key_user_id UUID,
  key_name TEXT,
  key_scopes TEXT[],
  key_rate_limit INTEGER,
  key_expires_at TIMESTAMPTZ
)
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id, user_id, name, scopes, rate_limit, expires_at
    FROM public.api_keys
   WHERE key_hash = p_hash
     AND is_active = true
     AND (expires_at IS NULL OR expires_at > now())
   LIMIT 1;
$$ LANGUAGE sql;

GRANT EXECUTE ON FUNCTION public.lookup_api_key(TEXT) TO anon, authenticated;

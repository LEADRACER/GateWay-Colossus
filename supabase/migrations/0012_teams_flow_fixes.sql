-- 0012 — teams flow fixes + orphan cleanup
-- 1. Atomic team creation via SECURITY DEFINER rpc (teams row + leader member
--    row either both succeed or both roll back — supabase-js cannot do this).
-- 2. Team members can view teams they belong to (private teams were invisible
--    to everyone except the leader).
-- 3. Optional cleanup block for orphan teams left by failed creations
--    (teams row created, member insert rolled back by an earlier RLS bug).
-- 2026-10-24

-- ─────────────────────────────────────────────────────────────────────────────
-- 1) ATOMIC CREATE
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION create_team_with_leader(
  p_name TEXT,
  p_description TEXT,
  p_avatar_url TEXT,
  p_is_public BOOLEAN,
  p_is_locked BOOLEAN,
  p_leader UUID
)
RETURNS teams
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_team teams%ROWTYPE;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = p_leader) THEN
    RAISE EXCEPTION 'no profile for leader %', p_leader;
  END IF;

  INSERT INTO teams (name, description, avatar_url, leader_id, is_public, is_locked)
  VALUES (p_name, p_description, p_avatar_url, p_leader, COALESCE(p_is_public, true), COALESCE(p_is_locked, false))
  RETURNING * INTO v_team;

  INSERT INTO team_members (team_id, user_id, role, status)
  VALUES (v_team.id, p_leader, 'leader', 'active');

  RETURN v_team;
END;
$$;

REVOKE ALL ON FUNCTION create_team_with_leader(TEXT, TEXT, TEXT, BOOLEAN, BOOLEAN, UUID) FROM anon, PUBLIC;
GRANT EXECUTE ON FUNCTION create_team_with_leader(TEXT, TEXT, TEXT, BOOLEAN, BOOLEAN, UUID) TO authenticated;

-- ─────────────────────────────────────────────────────────────────────────────
-- 2) MEMBERS CAN VIEW THEIR TEAM
-- ─────────────────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Members can view teams" ON teams;
CREATE POLICY "Members can view teams" ON teams
  FOR SELECT USING (is_team_member(teams.id, auth.uid()::uuid));

-- ─────────────────────────────────────────────────────────────────────────────
-- 3) ORPHAN CLEANUP (optional — inspect first, then uncomment)
--    A legit team always has its leader member row; zero-member teams are the
--    residue of failed creations (e.g. the two duplicate CyberSentinals).
-- ─────────────────────────────────────────────────────────────────────────────
-- SELECT id, code, name, leader_id, created_at
--   FROM teams t
--  WHERE NOT EXISTS (SELECT 1 FROM team_members m WHERE m.team_id = t.id);

-- DELETE FROM teams t
--  WHERE NOT EXISTS (SELECT 1 FROM team_members m WHERE m.team_id = t.id);

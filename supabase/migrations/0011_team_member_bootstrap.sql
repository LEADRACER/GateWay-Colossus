-- 0011 — team member bootstrap fix
-- The "Leaders and admins can invite members" insert policy required the
-- caller to ALREADY be a leader member of the team. During team creation the
-- leader row is the first member being inserted, so the check could never
-- pass and creation failed with "new row violates row level security policy".
-- 2026-10-24

DROP POLICY IF EXISTS "Leaders and admins can invite members" ON team_members;
CREATE POLICY "Leaders and admins can invite members" ON team_members
  FOR INSERT WITH CHECK (
    -- bootstrap: a team's leader adds themselves as the first member
    (team_members.user_id = auth.uid()::uuid
      AND EXISTS (
        SELECT 1 FROM teams
        WHERE teams.id = team_members.team_id
          AND teams.leader_id = auth.uid()::uuid
      ))
    -- existing leaders/admins of the team can add or update members
    OR is_team_member(team_members.team_id, auth.uid()::uuid, 'leader')
  );

-- Sanity: any policies on team_members should not recurse; re-grant is not
-- needed, is_team_member is still SECURITY DEFINER.

-- OPTIONAL CLEANUP: each failed create attempt may have left an orphan team
-- (teams row inserted, member insert rolled back in error — supabase-js does
-- not wrap both inserts in a transaction). Inspect, then uncomment to purge
-- teams that never got their leader member row.
-- SELECT t.id, t.name, t.created_at FROM teams t
--   LEFT JOIN team_members m ON m.team_id = t.id
--   WHERE m.id IS NULL AND t.leader_id = auth.uid()::uuid;
-- DELETE FROM teams t
--   WHERE NOT EXISTS (SELECT 1 FROM team_members m WHERE m.team_id = t.id)
--     AND t.leader_id = auth.uid()::uuid;


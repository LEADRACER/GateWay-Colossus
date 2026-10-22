-- Teams system (idempotent port of supabase-teams-migration.sql)
-- Previously applied by hand in the SQL editor; retained as a migration so
-- fresh environments get the same schema via `supabase db push`.

CREATE TABLE IF NOT EXISTS teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,           -- "team-name-a7f3k2"
  code CHAR(6) UNIQUE NOT NULL,        -- "a7f3k2" - for invites/URLs
  description TEXT,
  avatar_url TEXT,
  leader_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  is_locked BOOLEAN DEFAULT false,     -- locked = no join requests
  is_public BOOLEAN DEFAULT true,      -- discoverable in directory
  member_count INT DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- TEAM MEMBERS (Many-to-Many)
-- ============================================================
CREATE TABLE IF NOT EXISTS team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('leader','admin','member')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('pending','active','rejected','left')),
  invited_by UUID REFERENCES profiles(id),
  joined_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(team_id, user_id)
);

-- ============================================================
-- TEAM JOIN REQUESTS
-- ============================================================
CREATE TABLE IF NOT EXISTS team_join_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  message TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','accepted','rejected')),
  reviewed_by UUID REFERENCES profiles(id),
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(team_id, user_id)  -- one pending request per user per team
);

-- ============================================================
-- EXTEND PROJECTS FOR TEAM OWNERSHIP
-- ============================================================
ALTER TABLE projects 
  ADD COLUMN IF NOT EXISTS team_id UUID REFERENCES teams(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS is_team_project BOOLEAN DEFAULT false;

-- ============================================================
-- SHOWCASE REQUESTS
-- ============================================================
CREATE TABLE showcase_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  requested_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('homepage','fired','both')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  admin_notes TEXT,
  reviewed_by UUID REFERENCES profiles(id),
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_team_members_user ON team_members(user_id);
CREATE INDEX IF NOT EXISTS idx_team_members_team ON team_members(team_id);
CREATE INDEX IF NOT EXISTS idx_team_members_role ON team_members(role);
CREATE INDEX IF NOT EXISTS idx_team_join_requests_team ON team_join_requests(team_id);
CREATE INDEX IF NOT EXISTS idx_team_join_requests_user ON team_join_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_team_join_requests_status ON team_join_requests(status);
CREATE INDEX IF NOT EXISTS idx_showcase_requests_status ON showcase_requests(status);
CREATE INDEX IF NOT EXISTS idx_showcase_requests_project ON showcase_requests(project_id);
CREATE INDEX IF NOT EXISTS idx_projects_team ON projects(team_id);
CREATE INDEX IF NOT EXISTS idx_teams_leader ON teams(leader_id);
CREATE INDEX IF NOT EXISTS idx_teams_slug ON teams(slug);
CREATE INDEX IF NOT EXISTS idx_teams_code ON teams(code);

-- ============================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================

-- TEAMS: Public read for public teams, leader full access
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;

-- Public can view public teams
DROP POLICY IF EXISTS "Public teams are viewable by everyone" ON teams;
CREATE POLICY "Public teams are viewable by everyone" ON teams
  FOR SELECT USING (is_public = true);

-- Leader can view their own teams (even private)
DROP POLICY IF EXISTS "Leaders can view own teams" ON teams;
CREATE POLICY "Leaders can view own teams" ON teams
  FOR SELECT USING (leader_id = auth.uid()::uuid);

-- Authenticated users can create teams
DROP POLICY IF EXISTS "Authenticated users can create teams" ON teams;
CREATE POLICY "Authenticated users can create teams" ON teams
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Leader can update own team
DROP POLICY IF EXISTS "Leaders can update own teams" ON teams;
CREATE POLICY "Leaders can update own teams" ON teams
  FOR UPDATE USING (leader_id = auth.uid()::uuid);

-- Leader can delete own team
DROP POLICY IF EXISTS "Leaders can delete own teams" ON teams;
CREATE POLICY "Leaders can delete own teams" ON teams
  FOR DELETE USING (leader_id = auth.uid()::uuid);

-- TEAM MEMBERS: Members can view, leader/admin manage
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;

-- SECURITY DEFINER helper: TEAM MEMBERS POLICIES MUST NOT query team_members
-- directly (would recurse). This function bypasses RLS and answers
-- "is user X an active member of team Y with at least role min_role?"
CREATE OR REPLACE FUNCTION is_team_member(p_team UUID, p_user UUID, min_role TEXT DEFAULT 'member')
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
DECLARE
  r TEXT;
  req INT;
  have INT;
BEGIN
  IF min_role = 'leader' THEN req := 2;
  ELSIF min_role = 'admin' THEN req := 1;
  ELSE req := 0;
  END IF;

  SELECT role INTO r FROM team_members
  WHERE team_id = p_team AND user_id = p_user AND status = 'active';

  have := CASE r WHEN 'leader' THEN 2 WHEN 'admin' THEN 1 WHEN 'member' THEN 0 ELSE -1 END;
  RETURN have >= req;
END;
$$;

GRANT EXECUTE ON FUNCTION is_team_member(UUID, UUID, TEXT) TO anon, authenticated;

-- Team members can view team membership
DROP POLICY IF EXISTS "Team members can view membership" ON team_members;
CREATE POLICY "Team members can view membership" ON team_members
  FOR SELECT USING (
    user_id = auth.uid()::uuid
    OR is_team_member(team_members.team_id, auth.uid()::uuid)
  );

-- Leader/Admin can insert (invite)
DROP POLICY IF EXISTS "Leaders and admins can invite members" ON team_members;
CREATE POLICY "Leaders and admins can invite members" ON team_members
  FOR INSERT WITH CHECK (
    is_team_member(team_members.team_id, auth.uid()::uuid, 'leader')
  );

-- Leader/Admin can update roles
DROP POLICY IF EXISTS "Leaders and admins can update member roles" ON team_members;
CREATE POLICY "Leaders and admins can update member roles" ON team_members
  FOR UPDATE USING (
    is_team_member(team_members.team_id, auth.uid()::uuid, 'leader')
  );

-- Users can leave team (update status to 'left')
DROP POLICY IF EXISTS "Users can leave teams" ON team_members;
CREATE POLICY "Users can leave teams" ON team_members
  FOR UPDATE USING (user_id = auth.uid()::uuid);

-- Leader/Admin can delete (kick)
DROP POLICY IF EXISTS "Leaders and admins can remove members" ON team_members;
CREATE POLICY "Leaders and admins can remove members" ON team_members
  FOR DELETE USING (
    is_team_member(team_members.team_id, auth.uid()::uuid, 'leader')
  );

-- JOIN REQUESTS
ALTER TABLE team_join_requests ENABLE ROW LEVEL SECURITY;

-- Users can view requests for teams they're in (leader/admin) or their own requests
DROP POLICY IF EXISTS "View join requests" ON team_join_requests;
CREATE POLICY "View join requests" ON team_join_requests
  FOR SELECT USING (
    user_id = auth.uid()::uuid
    OR EXISTS (
      SELECT 1 FROM team_members tm
      WHERE tm.team_id = team_join_requests.team_id
      AND tm.user_id = auth.uid()::uuid
      AND tm.role IN ('leader','admin')
      AND tm.status = 'active'
    )
  );

-- Users can create join requests for public, unlocked teams
DROP POLICY IF EXISTS "Create join requests" ON team_join_requests;
CREATE POLICY "Create join requests" ON team_join_requests
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM teams t
      WHERE t.id = team_join_requests.team_id
      AND t.is_public = true
      AND t.is_locked = false
    )
    AND user_id = auth.uid()::uuid
  );

-- Leader/Admin can update (accept/reject)
DROP POLICY IF EXISTS "Review join requests" ON team_join_requests;
CREATE POLICY "Review join requests" ON team_join_requests
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM team_members tm
      WHERE tm.team_id = team_join_requests.team_id
      AND tm.user_id = auth.uid()::uuid
      AND tm.role IN ('leader','admin')
      AND tm.status = 'active'
    )
  );

-- SHOWCASE REQUESTS
ALTER TABLE showcase_requests ENABLE ROW LEVEL SECURITY;

-- Requester can view their own
DROP POLICY IF EXISTS "View own showcase requests" ON showcase_requests;
CREATE POLICY "View own showcase requests" ON showcase_requests
  FOR SELECT USING (requested_by = auth.uid()::uuid);

-- Admins can view all
DROP POLICY IF EXISTS "Admins view all showcase requests" ON showcase_requests;
CREATE POLICY "Admins view all showcase requests" ON showcase_requests
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()::uuid
      AND p.role = 'admin'
    )
  );

-- Users can create showcase requests for their projects (or team projects if leader/admin)
DROP POLICY IF EXISTS "Create showcase requests" ON showcase_requests;
CREATE POLICY "Create showcase requests" ON showcase_requests
  FOR INSERT WITH CHECK (
    requested_by = auth.uid()::uuid
    AND EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = showcase_requests.project_id
      AND (
        p.created_by = auth.uid()::uuid
        OR EXISTS (
          SELECT 1 FROM team_members tm
          WHERE tm.team_id = p.team_id
          AND tm.user_id = auth.uid()::uuid
          AND tm.role IN ('leader','admin')
          AND tm.status = 'active'
        )
      )
    )
  );

-- Admins can update (approve/reject/revoke)
DROP POLICY IF EXISTS "Admins manage showcase requests" ON showcase_requests;
CREATE POLICY "Admins manage showcase requests" ON showcase_requests
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()::uuid
      AND p.role = 'admin'
    )
  );

-- PROJECTS: Extend existing RLS for team_id
-- Team members can view team projects
DROP POLICY IF EXISTS "Team members view team projects" ON projects;
CREATE POLICY "Team members view team projects" ON projects
  FOR SELECT USING (
    team_id IS NULL
    OR EXISTS (
      SELECT 1 FROM team_members tm
      WHERE tm.team_id = projects.team_id
      AND tm.user_id = auth.uid()::uuid
      AND tm.status = 'active'
    )
  );

-- ============================================================
-- HELPER FUNCTIONS
-- ============================================================

-- Generate unique 6-char code
CREATE OR REPLACE FUNCTION generate_team_code()
RETURNS TEXT AS $$
DECLARE
  new_code TEXT;
  attempts INT := 0;
BEGIN
  LOOP
    new_code := upper(substring(md5(random()::text || clock_timestamp()::text) from 1 for 6));
    EXIT WHEN NOT EXISTS (SELECT 1 FROM teams WHERE teams.code = new_code);
    attempts := attempts + 1;
    IF attempts > 10 THEN
      RAISE EXCEPTION 'Failed to generate unique team code';
    END IF;
  END LOOP;
  RETURN new_code;
END;
$$ LANGUAGE plpgsql;

-- Generate slug from name + code
CREATE OR REPLACE FUNCTION generate_team_slug(p_name TEXT, p_code TEXT)
RETURNS TEXT AS $$
DECLARE
  base_slug TEXT;
  final_slug TEXT;
  counter INT := 0;
BEGIN
  base_slug := lower(regexp_replace(p_name, '[^a-zA-Z0-9]+', '-', 'g'));
  base_slug := trim(base_slug, '-');
  final_slug := base_slug || '-' || p_code;
  
  -- Ensure uniqueness (should be unique due to code, but safety)
  WHILE EXISTS (SELECT 1 FROM teams WHERE slug = final_slug) LOOP
    counter := counter + 1;
    final_slug := base_slug || '-' || p_code || '-' || counter;
  END LOOP;
  
  RETURN final_slug;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Auto-generate code + slug on team insert
CREATE OR REPLACE FUNCTION set_team_code_and_slug()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.code IS NULL THEN
    NEW.code := generate_team_code();
  END IF;
  IF NEW.slug IS NULL THEN
    NEW.slug := generate_team_slug(NEW.name, NEW.code);
  END IF;
  NEW.updated_at := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_set_team_code_slug ON teams;
CREATE TRIGGER trigger_set_team_code_slug
  BEFORE INSERT ON teams
  FOR EACH ROW EXECUTE FUNCTION set_team_code_and_slug();

-- Trigger: Update member_count on team_members changes
CREATE OR REPLACE FUNCTION update_team_member_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE teams SET member_count = member_count + 1, updated_at = now() WHERE id = NEW.team_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE teams SET member_count = member_count - 1, updated_at = now() WHERE id = OLD.team_id;
    RETURN OLD;
  ELSIF TG_OP = 'UPDATE' THEN
    -- Handle status change from/to active
    IF OLD.status = 'active' AND NEW.status != 'active' THEN
      UPDATE teams SET member_count = member_count - 1, updated_at = now() WHERE id = NEW.team_id;
    ELSIF OLD.status != 'active' AND NEW.status = 'active' THEN
      UPDATE teams SET member_count = member_count + 1, updated_at = now() WHERE id = NEW.team_id;
    END IF;
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_team_member_count ON team_members;
CREATE TRIGGER trigger_update_team_member_count
  AFTER INSERT OR DELETE OR UPDATE OF status ON team_members
  FOR EACH ROW EXECUTE FUNCTION update_team_member_count();

-- ============================================================
-- VERIFICATION QUERIES
-- ============================================================

-- Run after migration to verify:
-- SELECT * FROM teams LIMIT 5;
-- SELECT * FROM team_members LIMIT 5;
-- SELECT * FROM team_join_requests LIMIT 5;
-- SELECT * FROM showcase_requests LIMIT 5;
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'projects' AND column_name IN ('team_id', 'is_team_project');
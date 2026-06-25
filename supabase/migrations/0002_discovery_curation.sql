-- GateWay:Colossus — Phase 10 Migration: Discovery & Curation
-- Run this in Supabase SQL editor

-- ── Categories ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.categories (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL UNIQUE,
  slug text NOT NULL UNIQUE,
  description text,
  icon text,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_categories_slug ON public.categories(slug);
CREATE INDEX IF NOT EXISTS idx_categories_sort_order ON public.categories(sort_order);

-- ── Project Categories (many-to-many) ────────────────────────────────
CREATE TABLE IF NOT EXISTS public.project_categories (
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  category_id uuid NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
  PRIMARY KEY (project_id, category_id)
);

CREATE INDEX IF NOT EXISTS idx_project_categories_project ON public.project_categories(project_id);
CREATE INDEX IF NOT EXISTS idx_project_categories_category ON public.project_categories(category_id);

-- ── Featured / Pinned Projects ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.featured_projects (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE UNIQUE,
  featured_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  note text,
  starts_at timestamptz DEFAULT now() NOT NULL,
  expires_at timestamptz,
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_featured_projects_project ON public.featured_projects(project_id);
CREATE INDEX IF NOT EXISTS idx_featured_projects_expires ON public.featured_projects(expires_at);

-- ── Seed Categories ───────────────────────────────────────────────────
INSERT INTO public.categories (name, slug, description, icon, sort_order) VALUES
  ('Web App', 'web-app', 'Full-stack web applications', 'globe', 1),
  ('CLI Tool', 'cli-tool', 'Command-line utilities and tools', 'terminal', 2),
  ('Mobile', 'mobile', 'iOS and Android applications', 'smartphone', 3),
  ('Library', 'library', 'Reusable packages and frameworks', 'book-open', 4),
  ('DevOps', 'devops', 'Infrastructure, CI/CD, and deployment', 'server', 5),
  ('AI/ML', 'ai-ml', 'Artificial intelligence and machine learning', 'brain', 6),
  ('Game', 'game', 'Game development and interactive experiences', 'gamepad-2', 7),
  ('Security', 'security', 'Security tools and penetration testing', 'shield', 8),
  ('Data', 'data', 'Data engineering, analytics, and visualization', 'database', 9),
  ('IoT', 'iot', 'Internet of Things and embedded systems', 'cpu', 10)
ON CONFLICT (slug) DO NOTHING;

-- ── RLS Policies ───────────────────────────────────────────────────────
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.featured_projects ENABLE ROW LEVEL SECURITY;

-- Categories: anyone can read, only admins can write
CREATE POLICY "Categories viewable by everyone" ON public.categories FOR SELECT USING (true);
CREATE POLICY "Admins can manage categories" ON public.categories FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Project categories: anyone can read, project owner can write
CREATE POLICY "Project categories viewable by everyone" ON public.project_categories FOR SELECT USING (true);
CREATE POLICY "Project owners can set categories" ON public.project_categories FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM projects WHERE id = project_id AND created_by = auth.uid())
);
CREATE POLICY "Project owners can remove categories" ON public.project_categories FOR DELETE USING (
  EXISTS (SELECT 1 FROM projects WHERE id = project_id AND created_by = auth.uid())
);

-- Featured: anyone can read, only admins can write
CREATE POLICY "Featured projects viewable by everyone" ON public.featured_projects FOR SELECT USING (true);
CREATE POLICY "Admins can feature projects" ON public.featured_projects FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- ── Functions ──────────────────────────────────────────────────────────
-- Get trending projects (stars + likes weighted by recency)
CREATE OR REPLACE FUNCTION public.get_trending_projects(limit_count integer DEFAULT 10)
RETURNS TABLE (
  project_id uuid,
  trend_score numeric,
  project_data jsonb
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id AS project_id,
    (
      COALESCE(p.repo_stars, 0) * 2 +
      COALESCE((SELECT count(*) FROM likes l WHERE l.project_id = p.id), 0) * 3 +
      COALESCE((SELECT count(*) FROM comments c WHERE c.project_id = p.id), 0) * 1.5 +
      -- Recency boost: projects created in last 7 days get bonus
      CASE WHEN p.created_at > now() - interval '7 days' THEN 10
           WHEN p.created_at > now() - interval '30 days' THEN 5
           ELSE 0
      END
    )::numeric AS trend_score,
    jsonb_build_object(
      'id', p.id,
      'name', p.name,
      'owner', p.owner,
      'repo_name', p.repo_name,
      'repo_description', p.repo_description,
      'repo_stars', p.repo_stars,
      'repo_language', p.repo_language,
      'repo_avatar', p.repo_avatar,
      'status', p.status,
      'created_at', p.created_at
    ) AS project_data
  FROM projects p
  WHERE p.status = 'active'
  ORDER BY trend_score DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql STABLE;

-- Get featured projects (currently active)
CREATE OR REPLACE FUNCTION public.get_featured_projects()
RETURNS TABLE (
  project_id uuid,
  featured_by uuid,
  note text,
  project_data jsonb
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    fp.project_id,
    fp.featured_by,
    fp.note,
    jsonb_build_object(
      'id', p.id,
      'name', p.name,
      'owner', p.owner,
      'repo_name', p.repo_name,
      'repo_description', p.repo_description,
      'repo_stars', p.repo_stars,
      'repo_language', p.repo_language,
      'repo_avatar', p.repo_avatar,
      'status', p.status,
      'created_at', p.created_at
    ) AS project_data
  FROM featured_projects fp
  JOIN projects p ON p.id = fp.project_id
  WHERE fp.expires_at IS NULL OR fp.expires_at > now()
  ORDER BY fp.created_at DESC;
END;
$$ LANGUAGE plpgsql STABLE;

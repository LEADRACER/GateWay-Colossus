-- GateWay:Colossus — Phase 9 Migration: Social & Engagement
-- Run this in Supabase SQL editor

-- ── Likes ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.likes (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(user_id, project_id)
);

CREATE INDEX IF NOT EXISTS idx_likes_project_id ON public.likes(project_id);
CREATE INDEX IF NOT EXISTS idx_likes_user_id ON public.likes(user_id);

-- ── Bookmarks ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.bookmarks (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(user_id, project_id)
);

CREATE INDEX IF NOT EXISTS idx_bookmarks_project_id ON public.bookmarks(project_id);
CREATE INDEX IF NOT EXISTS idx_bookmarks_user_id ON public.bookmarks(user_id);

-- ── Comments ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.comments (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  content text NOT NULL CHECK (char_length(content) > 0 AND char_length(content) <= 2000),
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_comments_project_id ON public.comments(project_id);
CREATE INDEX IF NOT EXISTS idx_comments_user_id ON public.comments(user_id);

-- ── Activity Log ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.activities (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action text NOT NULL CHECK (action IN ('project_created', 'project_liked', 'project_bookmarked', 'comment_added', 'project_submitted', 'project_approved', 'project_rejected')),
  project_id uuid REFERENCES public.projects(id) ON DELETE SET NULL,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_activities_user_id ON public.activities(user_id);
CREATE INDEX IF NOT EXISTS idx_activities_project_id ON public.activities(project_id);
CREATE INDEX IF NOT EXISTS idx_activities_created_at ON public.activities(created_at DESC);

-- ── RLS Policies ───────────────────────────────────────────────────────
ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;

-- Likes: anyone can read, authenticated can insert/delete own
CREATE POLICY "Likes are viewable by everyone" ON public.likes FOR SELECT USING (true);
CREATE POLICY "Users can like projects" ON public.likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can unlike their own likes" ON public.likes FOR DELETE USING (auth.uid() = user_id);

-- Bookmarks: anyone can read, authenticated can insert/delete own
CREATE POLICY "Bookmarks are viewable by everyone" ON public.bookmarks FOR SELECT USING (true);
CREATE POLICY "Users can bookmark projects" ON public.bookmarks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can remove their own bookmarks" ON public.bookmarks FOR DELETE USING (auth.uid() = user_id);

-- Comments: anyone can read, authenticated can insert, owner can update/delete
CREATE POLICY "Comments are viewable by everyone" ON public.comments FOR SELECT USING (true);
CREATE POLICY "Users can add comments" ON public.comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can edit their own comments" ON public.comments FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own comments" ON public.comments FOR DELETE USING (auth.uid() = user_id);

-- Activities: anyone can read public activities, authenticated can insert own
CREATE POLICY "Activities are viewable by everyone" ON public.activities FOR SELECT USING (true);
CREATE POLICY "Users can create their own activities" ON public.activities FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ── Functions ──────────────────────────────────────────────────────────
-- Get like count for a project
CREATE OR REPLACE FUNCTION public.get_like_count(p_project_id uuid)
RETURNS integer AS $$
  SELECT count(*)::integer FROM public.likes WHERE project_id = p_project_id;
$$ LANGUAGE sql STABLE;

-- Get bookmark count for a project
CREATE OR REPLACE FUNCTION public.get_bookmark_count(p_project_id uuid)
RETURNS integer AS $$
  SELECT count(*)::integer FROM public.bookmarks WHERE project_id = p_project_id;
$$ LANGUAGE sql STABLE;

-- Get comment count for a project
CREATE OR REPLACE FUNCTION public.get_comment_count(p_project_id uuid)
RETURNS integer AS $$
  SELECT count(*)::integer FROM public.comments WHERE project_id = p_project_id;
$$ LANGUAGE sql STABLE;

-- ── Triggers ───────────────────────────────────────────────────────────
-- Update projects.updated_at on like/comment changes
CREATE OR REPLACE FUNCTION public.trigger_update_project_timestamp()
RETURNS trigger AS $$
BEGIN
  IF TG_TABLE_NAME = 'likes' OR TG_TABLE_NAME = 'bookmarks' THEN
    UPDATE projects SET updated_at = now() WHERE id = COALESCE(NEW.project_id, OLD.project_id);
  ELSIF TG_TABLE_NAME = 'comments' THEN
    UPDATE projects SET updated_at = now() WHERE id = COALESCE(NEW.project_id, OLD.project_id);
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_likes_update_project
  AFTER INSERT OR DELETE ON public.likes
  FOR EACH ROW EXECUTE FUNCTION public.trigger_update_project_timestamp();

CREATE TRIGGER trg_bookmarks_update_project
  AFTER INSERT OR DELETE ON public.bookmarks
  FOR EACH ROW EXECUTE FUNCTION public.trigger_update_project_timestamp();

CREATE TRIGGER trg_comments_update_project
  AFTER INSERT OR UPDATE OR DELETE ON public.comments
  FOR EACH ROW EXECUTE FUNCTION public.trigger_update_project_timestamp();

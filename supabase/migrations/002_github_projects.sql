-- Migration 002: GitHub-first projects — auto-populate from repo URL
-- Run this AFTER 001_init.sql
-- Drops old columns, adds GitHub-specific columns

-- 1. Drop old columns, add GitHub-native fields
alter table public.projects
  drop column if exists purpose,
  drop column if exists description,
  drop column if exists website_url,
  drop column if exists logo_url,
  drop column if exists tags,
  add column if not exists owner           text not null default '',
  add column if not exists repo_name       text not null default '',
  add column if not exists repo_description text,
  add column if not exists repo_language   text,
  add column if not exists repo_topics     text[] default '{}',
  add column if not exists repo_stars      int default 0,
  add column if not exists repo_license    text,
  add column if not exists repo_avatar     text,
  add column if not exists cached_at       timestamptz;

-- 2. Make github_url unique — no duplicate repos
alter table public.projects
  add constraint projects_github_url_key unique (github_url);

-- 3. Add index on owner/repo for lookups
create index if not exists idx_projects_owner_repo on public.projects (owner, repo_name);

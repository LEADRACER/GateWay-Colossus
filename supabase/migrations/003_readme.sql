-- Migration 003: Add repo_readme column
alter table public.projects
  add column if not exists repo_readme text;

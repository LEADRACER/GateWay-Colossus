-- Migration 001: Create profiles table and auth hooks
-- GateWay:Colossus — for Supabase SQL Editor

-- 1. Profiles table
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  member_id   int unique,
  username    text unique not null,
  avatar_url  text,
  bio         text,
  role        text not null default 'viewer' check (role in ('admin', 'member', 'viewer')),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- 2. Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $func$
begin
  insert into public.profiles (id, username, role)
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data ->> 'preferred_username',
      new.raw_user_meta_data ->> 'user_name',
      split_part(new.email, '@', 1)
    ),
    'viewer'
  );
  return new;
end;
$func$;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 3. Updated_at trigger
create or replace function public.handle_updated_at()
returns trigger
language plpgsql
security definer set search_path = ''
as $func$
begin
  new.updated_at = now();
  return new;
end;
$func$;

create or replace trigger on_profile_updated
  before update on public.profiles
  for each row execute function public.handle_updated_at();

-- 4. Projects table
create table if not exists public.projects (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  purpose       text not null,
  description   text not null,
  github_url    text,
  website_url   text,
  logo_url      text,
  tags          text[] default '{}',
  status        text not null default 'active' check (status in ('active', 'archived', 'in development')),
  created_by    uuid not null references public.profiles(id) on delete cascade,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create or replace trigger on_project_updated
  before update on public.projects
  for each row execute function public.handle_updated_at();

-- 5. Row Level Security
alter table public.profiles enable row level security;
alter table public.projects enable row level security;

create policy "Profiles are publicly readable"
  on public.profiles for select
  using (true);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

create policy "Projects are publicly readable"
  on public.projects for select
  using (true);

create policy "Authenticated users can create projects"
  on public.projects for insert
  with check (auth.role() = 'authenticated');

create policy "Project owner or admin can update"
  on public.projects for update
  using (
    auth.uid() = created_by
    or exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

create policy "Project owner or admin can delete"
  on public.projects for delete
  using (
    auth.uid() = created_by
    or exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- 6. Seed yourself as admin (run after signup)
-- Replace 'your-email@example.com' with the email you signed up with:
-- update public.profiles set role = 'admin' where username = '<your-username>';

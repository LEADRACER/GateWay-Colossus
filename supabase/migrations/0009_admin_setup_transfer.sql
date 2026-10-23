-- ============================================================
-- 0009 — ADMIN SETUP + PROJECT OWNERSHIP TRANSFER (run once, idempotent)
-- ============================================================
-- What it does:
--   1. Adds the created_by_login / created_by_avatar columns the app
--      already writes on POST /api/projects (they were missing -> submit 500).
--   2. Promotes the GitHub login configured below to admin.
--   3. Transfers ALL existing projects from the previous owner
--      (auto-detected as the profile that currently owns the most projects)
--      to the new admin, including the login/avatar attribution columns.
--   4. Transfers team leadership + memberships from the old owner.
--
--  EDIT THE LINE MARKED (1) BEFORE RUNNING.
--  The new admin's row must exist: log in once with GitHub first
--  (or create the profile manually) so profiles.login is set.
-- ============================================================

alter table public.projects
  add column if not exists created_by_login text,
  add column if not exists created_by_avatar text;

do $$
declare
  -- (1) ---- CHANGE THIS to your GitHub login -----------------
  v_new_login text := 'leadracer736';
  -- -----------------------------------------------------------
  v_new_id uuid;
  v_old_id uuid;
  v_old_login text;
  v_project_count bigint;
begin
  -- Resolve new admin by login, fall back to username match
  select id into v_new_id
  from public.profiles
  where login = v_new_login or username = v_new_login;

  if v_new_id is null then
    raise exception 'No profiles row found for login "%". Log in once with GitHub so the profile is created, then re-run.', v_new_login;
  end if;

  -- Promote
  update public.profiles
     set role = 'admin',
         can_add_projects = true,
         updated_at = now()
   where id = v_new_id;

  -- Detect the previous owner: profile owning the most projects that is NOT the new admin.
  -- (matches everything the old admin account created)
  select p.created_by, count(*) into v_old_id, v_project_count
    from public.projects p
   where p.created_by <> v_new_id
   group by p.created_by
   order by count(*) desc
   limit 1;

  if v_old_id is null then
    raise notice 'No other project owner found - nothing to transfer.';
    v_old_login := null;
    return;
  end if;

  select coalesce(login, username) into v_old_login
    from public.profiles where id = v_old_id;

  -- Transfer ownership + attribution
  update public.projects
     set created_by       = v_new_id,
         created_by_login = v_new_login,
         updated_at       = now()
   where created_by = v_old_id;

  -- Team leadership: everything the old owner led now belongs to the new admin.
  update public.teams
     set leader_id = v_new_id
   where leader_id = v_old_id;

  -- Memberships: move rows, resolving unique(team_id,user_id) collisions
  -- (if the new admin is already a member of a team on their own, drop the
  -- old owner's duplicate row first, keeping the new admin's existing one).
  delete from public.team_members tm
   where tm.user_id = v_old_id
     and exists (
       select 1 from public.team_members other
        where other.team_id = tm.team_id
          and other.user_id = v_new_id
     );

  update public.team_members
     set user_id = v_new_id
   where user_id = v_old_id;

  -- NOTE: likes / bookmarks / comments / activities keep the old owner as the
  -- author on purpose - they are historical personal records. Uncomment the
  -- block below if you want them to read as the new admin instead:
  --
  -- update public.likes       set user_id = v_new_id where user_id = v_old_id;
  -- update public.bookmarks   set user_id = v_new_id where user_id = v_old_id;
  -- update public.comments    set user_id = v_new_id where user_id = v_old_id;
  -- update public.activities  set user_id = v_new_id where user_id = v_old_id;

  raise notice 'Transferred % project(s) from "%" (%) to "%" (admin, can_add_projects).',
    v_project_count, v_old_login, v_old_id, v_new_login;
end;
$$;

-- ============================================================
-- VERIFICATION (run after; expected: new admin on everything)
-- ============================================================
select username, login, github_id, role, can_add_projects from public.profiles;

select p.name,
       p.created_by,
       pr.login  as owner_login,
       p.created_by_login
  from public.projects p
  join public.profiles pr on pr.id = p.created_by
 order by p.created_at;

select t.name, t.code, t.leader_id, pr.login as leader_login
  from public.teams t
  join public.profiles pr on pr.id = t.leader_id;

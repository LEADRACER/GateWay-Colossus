-- GitHub identity columns for profiles (aligned with Supabase Auth GitHub provider)
-- The app treats github_id/login as core columns; make them first-class here.

alter table public.profiles
  add column if not exists github_id bigint unique,
  add column if not exists login text unique,
  add column if not exists can_add_projects boolean not null default false;

create index if not exists profiles_github_id_idx on public.profiles (github_id);

-- New user trigger: pull GitHub identity from the provider metadata that
-- Supabase populates (identities row for provider 'github').
create or replace function public.handle_new_user()
returns trigger
as $func$
declare
  github_num_id bigint;
  github_login text;
  github_avatar text;
begin
  select nullif(ident -> 'identity_data' ->> 'sub', '')::bigint
    into github_num_id
  from jsonb_array_elements(new.identities) as ident
  where ident ->> 'provider_id' = 'github'
  limit 1;

  -- raw_user_meta_data carries user_name / avatar_url from the GitHub provider
  github_login := coalesce(
    new.raw_user_meta_data ->> 'user_name',
    new.raw_user_meta_data ->> 'preferred_username',
    new.raw_user_meta_data ->> 'login',
    split_part(new.email, '@', 1)
  );
  github_avatar := new.raw_user_meta_data ->> 'avatar_url';

  insert into public.profiles (id, username, github_id, login, avatar_url, role)
  values (
    new.id,
    coalesce(github_login, split_part(new.email, '@', 1)),
    github_num_id,
    github_login,
    github_avatar,
    'viewer'
  );
  return new;
end;
$func$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

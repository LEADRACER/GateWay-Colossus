-- 0008: Harden handle_new_user for non-GitHub signups
-- (email/password users have no GitHub identity; the previous version crashed
-- on jsonb_array_elements(NULL) -> Supabase /auth/v1/signup 500)

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
AS $func$
DECLARE
  github_num_id bigint;
  github_login text;
  github_avatar text;
BEGIN
  github_login := coalesce(
    new.raw_user_meta_data ->> 'user_name',
    new.raw_user_meta_data ->> 'preferred_username',
    new.raw_user_meta_data ->> 'login',
    split_part(coalesce(new.email, 'user'), '@', 1)
  );
  github_avatar := new.raw_user_meta_data ->> 'avatar_url';

  IF new.identities IS NOT NULL
     AND jsonb_typeof(new.identities) = 'array'
     AND EXISTS (
       SELECT 1
       FROM jsonb_array_elements(new.identities) AS ident
       WHERE ident ->> 'provider_id' = 'github'
     ) THEN
    SELECT nullif(ident -> 'identity_data' ->> 'sub', '')::bigint
      INTO github_num_id
    FROM jsonb_array_elements(new.identities) AS ident
    WHERE ident ->> 'provider_id' = 'github'
    LIMIT 1;
  ELSE
    -- No GitHub identity on this auth user; leave github_id NULL.
    github_num_id := NULL;
    github_login := NULL;
  END IF;

  INSERT INTO public.profiles (id, username, github_id, login, avatar_url, role)
  VALUES (
    new.id,
    coalesce(github_login, split_part(coalesce(new.email, 'user'), '@', 1)),
    github_num_id,
    github_login,
    github_avatar,
    'viewer'
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN new;
EXCEPTION WHEN OTHERS THEN
  -- Never block user creation because of a profile-seeding hiccup.
  RAISE WARNING 'handle_new_user failed: %', sqlerrm;
  RETURN new;
END;
$func$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

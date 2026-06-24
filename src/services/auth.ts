import type { TypedSupabaseClient } from '@/lib/supabase/client'

export async function signUp(
  client: TypedSupabaseClient,
  email: string,
  password: string,
) {
  const { data, error } = await client.auth.signUp({ email, password })
  if (error) throw new Error(error.message)
  return data
}

export async function signIn(
  client: TypedSupabaseClient,
  email: string,
  password: string,
) {
  const { data, error } = await client.auth.signInWithPassword({ email, password })
  if (error) throw new Error(error.message)
  return data
}

export async function signOut(client: TypedSupabaseClient) {
  const { error } = await client.auth.signOut()
  if (error) throw new Error(error.message)
}

export async function signInWithGitHub(client: TypedSupabaseClient) {
  const { data, error } = await client.auth.signInWithOAuth({
    provider: 'github',
    options: { redirectTo: `${window.location.origin}/auth/callback` },
  })
  if (error) throw new Error(error.message)
  return data
}

export async function signInWithGoogle(client: TypedSupabaseClient) {
  const { data, error } = await client.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: `${window.location.origin}/auth/callback` },
  })
  if (error) throw new Error(error.message)
  return data
}

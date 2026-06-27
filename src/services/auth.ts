import type { TypedSupabaseClient } from '@/lib/supabase/client'

const getBaseUrl = () => {
  if (typeof window !== 'undefined') return window.location.origin
  return process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
}

export async function signUp(
  client: TypedSupabaseClient,
  email: string,
  password: string,
) {
  const { data, error } = await client.auth.signUp({
    email,
    password,
    options: { emailRedirectTo: `${getBaseUrl()}/auth/callback` },
  })
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
    options: { redirectTo: `${getBaseUrl()}/auth/callback` },
  })
  if (error) throw new Error(error.message)
  return data
}

export async function signInWithGoogle(client: TypedSupabaseClient) {
  const { data, error } = await client.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: `${getBaseUrl()}/auth/callback` },
  })
  if (error) throw new Error(error.message)
  return data
}

export async function resetPassword(client: TypedSupabaseClient, email: string) {
  const { error } = await client.auth.resetPasswordForEmail(email, {
    redirectTo: `${getBaseUrl()}/auth/reset-password`,
  })
  if (error) throw new Error(error.message)
}

export async function updatePassword(client: TypedSupabaseClient, password: string) {
  const { error } = await client.auth.updateUser({ password })
  if (error) throw new Error(error.message)
}

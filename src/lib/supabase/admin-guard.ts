import { createServerSupabaseClient } from './server'
import type { TypedSupabaseClient } from './client'

export interface AdminGuard {
  supabase: TypedSupabaseClient
  userId: string
  githubId: string
  login: string | null
  avatarUrl: string | null
}

export async function requireAdmin(): Promise<AdminGuard | null> {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, github_id, login, avatar_url')
    .eq('id', user.id)
    .maybeSingle()

  if (!profile || profile.role !== 'admin') return null

  return {
    supabase,
    userId: user.id,
    githubId: profile.github_id != null ? String(profile.github_id) : user.id,
    login: profile.login ?? null,
    avatarUrl: profile.avatar_url ?? null,
  }
}

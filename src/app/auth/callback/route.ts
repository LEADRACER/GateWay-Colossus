import { NextResponse, type NextRequest } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/projects'

  if (code) {
    const supabase = await createServerSupabaseClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (error) {
      return NextResponse.redirect(`${origin}/auth/signin?error=${encodeURIComponent(error.message)}`)
    }

    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const identities = (user.identities ?? []) as Array<{
        provider: string | null
        identity_data: { sub?: string | null; user_name?: string | null; preferred_username?: string | null; avatar_url?: string | null } | null
      }>
      const githubIdentity = identities.find(i => i.provider === 'github')
      const meta = (user.user_metadata ?? {}) as Record<string, unknown>

      const githubId = githubIdentity?.identity_data?.sub
        ?? (typeof meta.sub === 'string' && /^\d+$/.test(meta.sub) ? meta.sub : null)
      const login = githubIdentity?.identity_data?.user_name
        ?? githubIdentity?.identity_data?.preferred_username
        ?? (typeof meta.user_name === 'string' ? meta.user_name : null)
      const avatarUrl = githubIdentity?.identity_data?.avatar_url
        ?? (typeof meta.avatar_url === 'string' ? meta.avatar_url : null)
      const email = typeof user.email === 'string' ? user.email : null

      const profilePatch = {
        ...(githubId != null ? { github_id: Number(githubId) } : {}),
        ...(login != null ? { login } : {}),
        ...(avatarUrl != null ? { avatar_url: avatarUrl } : {}),
      }

      const { data: existing } = await supabase
        .from('profiles')
        .select('id, username')
        .eq('id', user.id)
        .maybeSingle()

      if (existing) {
        if (Object.keys(profilePatch).length > 0) {
          await supabase.from('profiles').update(profilePatch).eq('id', user.id)
        }
      } else {
        const baseUsername = login ?? (email ? email.split('@')[0] : `user-${user.id.slice(0, 8)}`)
        const insert = await supabase.from('profiles').insert({
          id: user.id,
          ...profilePatch,
          username: baseUsername,
          role: 'viewer',
        })
        if (insert.error?.code === '23505') {
          await supabase.from('profiles').insert({
            id: user.id,
            ...profilePatch,
            username: `${baseUsername}-${user.id.slice(0, 4)}`,
            role: 'viewer',
          })
        }
      }
    }
  }

  return NextResponse.redirect(`${origin}${next.startsWith('/') ? next : '/projects'}`)
}

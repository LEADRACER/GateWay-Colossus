import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export interface AuthIdentity {
  userId: string
  githubId: string | null
  login: string | null
  avatarUrl: string | null
  email: string | null
  role: string
}

export interface CookieUpdate {
  name: string
  value: string
  options: Record<string, unknown>
}

export interface AuthResolution {
  response: NextResponse
  identity: AuthIdentity | null
  cookieUpdates: CookieUpdate[]
}

export function resolveAuth(request: NextRequest): Promise<AuthResolution> {
  const cookieUpdates: CookieUpdate[] = []
  let response = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options)
            cookieUpdates.push({ name, value, options })
          })
        },
      },
    },
  )

  return (async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return { response, identity: null, cookieUpdates }

      const { data: profile } = await supabase
        .from('profiles')
        .select('github_id, login, avatar_url, role')
        .eq('id', user.id)
        .maybeSingle()

      const identity: AuthIdentity = {
        userId: user.id,
        githubId: profile?.github_id != null ? String(profile.github_id) : null,
        login: profile?.login ?? null,
        avatarUrl: profile?.avatar_url ?? (user.user_metadata?.avatar_url as string | undefined) ?? null,
        email: user.email ?? null,
        role: profile?.role ?? 'viewer',
      }
      return { response, identity, cookieUpdates }
    } catch {
      return { response, identity: null, cookieUpdates }
    }
  })()
}

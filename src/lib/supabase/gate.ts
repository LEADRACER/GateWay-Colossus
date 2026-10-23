import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import {
  SESSION_COOKIE_MAX_AGE,
  SESSION_REFRESH_MARGIN_SECONDS,
  SECURE_COOKIES,
} from '@/lib/supabase/cookies'

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
            const hardened = {
              ...options,
              httpOnly: false as const, // browser client must be able to read+refresh
              path: '/',
              sameSite: 'lax' as const,
              secure: SECURE_COOKIES,
              maxAge: SESSION_COOKIE_MAX_AGE,
            }
            response.cookies.set(name, value, hardened)
            cookieUpdates.push({ name, value, options: hardened })
          })
        },
      },
    },
  )

  return (async () => {
    try {
      // Sliding session: if the access token is gone or about to die,
      // rotate it from the refresh token while we are already here.
      // (browser tabs refresh on their own; this covers the
      //  "close the laptop, come back next week" path on any request)
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        const expiresAt = session.expires_at
        if (
          expiresAt != null &&
          expiresAt - Math.floor(Date.now() / 1000) < SESSION_REFRESH_MARGIN_SECONDS
        ) {
          await supabase.auth.refreshSession()
          // Rotated cookies flow through setAll (same adapter) — no manual write needed.
        }
      }

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

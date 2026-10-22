'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export interface SessionUser {
  id: string
  githubId: number | null
  githubLogin: string | null
  avatarUrl: string | null
  role: string | null
}

export interface Session {
  user: SessionUser | null
}

export interface SessionResult {
  data: Session | null
  status: 'loading' | 'authenticated' | 'unauthenticated'
}

interface IdentityLike {
  provider: string | null
  identity_data: { sub?: string | null; user_name?: string | null; preferred_username?: string | null; avatar_url?: string | null } | null
}

export function useSupabaseSession(): SessionResult {
  const [result, setResult] = useState<SessionResult>({ data: null, status: 'loading' })

  useEffect(() => {
    const supabase = createClient()
    let active = true

    const load = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!active) return
        if (!user) {
          setResult({ data: null, status: 'unauthenticated' })
          return
        }

        const identities = (user.identities ?? []) as unknown as IdentityLike[]
        const githubIdentity = identities.find(i => i.provider === 'github')
        const meta = (user.user_metadata ?? {}) as Record<string, unknown>

        const githubSub = githubIdentity?.identity_data?.sub
          ?? (typeof meta.sub === 'string' && /^\d+$/.test(meta.sub) ? meta.sub : null)
        const githubLogin = githubIdentity?.identity_data?.user_name
          ?? githubIdentity?.identity_data?.preferred_username
          ?? (typeof meta.user_name === 'string' ? meta.user_name : null)
        const avatarUrl = githubIdentity?.identity_data?.avatar_url
          ?? (typeof meta.avatar_url === 'string' ? meta.avatar_url : null)

        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .maybeSingle()

        if (!active) return

        setResult({
          data: {
            user: {
              id: user.id,
              githubId: githubSub != null ? Number(githubSub) : null,
              githubLogin,
              avatarUrl,
              role: profile?.role ?? null,
            },
          },
          status: 'authenticated',
        })
      } catch {
        if (active) setResult({ data: null, status: 'unauthenticated' })
      }
    }

    load()
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      load()
    })

    return () => {
      active = false
      subscription.unsubscribe()
    }
  }, [])

  return result
}

export async function supabaseSignOut(callbackUrl?: string): Promise<void> {
  const supabase = createClient()
  await supabase.auth.signOut()
  if (typeof window !== 'undefined' && callbackUrl) window.location.assign(callbackUrl)
  else if (typeof window !== 'undefined') window.location.assign('/')
}

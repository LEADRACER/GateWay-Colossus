import { createBrowserClient } from '@supabase/ssr'
import { browserCookieOptions } from '@/lib/supabase/cookies'
import type { Profile, Project } from '@/lib/types/database'

export type TypedSupabaseClient = ReturnType<typeof createClient>

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookieOptions: browserCookieOptions(),
      isSingleton: true, // one shared instance across tabs; avoids refresh races
    },
  )
}

export type { Profile, Project }

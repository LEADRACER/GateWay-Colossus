import { createBrowserClient } from '@supabase/ssr'
import type { Profile, Project } from '@/lib/types/database'

export type TypedSupabaseClient = ReturnType<typeof createClient>

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )
}

// Re-export types for convenience
export type { Profile, Project }

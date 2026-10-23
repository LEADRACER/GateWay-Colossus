import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { serverCookieOptions } from '@/lib/supabase/cookies'

// Route-handlers + Server Components. Cookie writes funnel through
// lib/supabase/cookies so every surface (gate, RSC, browser) agrees on
// security + lifetime policy. When invoked from a Server Component the
// store is read-only — the throws are swallowed and the refreshed tokens
// are re-emitted by the response wrapper instead.
export async function createServerSupabaseClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, serverCookieOptions(options)),
            )
          } catch {
            // Called from a Server Component — ignore (Next.js handles)
          }
        },
      },
    },
  )
}

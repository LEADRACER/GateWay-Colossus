// Shared session-cookie policy for every Supabase client in the app.
//
// Goal: one place defines safety + persistence knobs so server (RSC/route
// handlers/middleware) and browser always agree.
//
// SAFETY
//  - `secure` in production (HTTPS only — Vercel + localhost-dev handled).
//  - `sameSite: 'lax'`: CSRF-hardened for non-GET requests while still
//    allowing the OAuth redirect back to /auth/callback (top-level
//    navigation from github.com carries the cookie only under `lax`).
//  - NOT httpOnly on purpose: the browser client must read/refresh the
//    token (it is the token keeper). A server-imposed httpOnly flag would
//    break refresh entirely. JSON-encoded payload + secure+lax is the
//    standard Supabase-SSR hardening level.
//
// RELIABILITY
//  - Oversized tokens (GitHub OAuth JWTs are ~1-2KB) are auto-chunked by
//    @supabase/ssr; keep options identical in all writers so chunks round-trip.
//  - Stale/expired cookies never wedge the gate: resolveAuth refreshes an
//    expiring session server-side (sliding window) and falls back to anon.
//
// PERSISTENCE
//  - 30-day sliding window (default refresh-token lifetime at Supabase).
//  - Every server resolution re-emits fresh cookies (rotation), so a
//    returning user keeps the session without any tab being open.

export const SESSION_COOKIE_MAX_AGE = 60 * 60 * 24 * 30 // 30 days
export const SESSION_REFRESH_MARGIN_SECONDS = 300 // refresh when within 5min of expiry

export const SECURE_COOKIES =
  process.env.NODE_ENV === 'production' || process.env.VERCEL === '1'

interface BaseCookieOptions {
  httpOnly?: boolean
  path?: string
  sameSite?: 'lax' | 'strict' | 'none' | boolean
  secure?: boolean
  maxAge?: number
}

// For middleware / route handlers / RSC — OPTIONS used by Response.cookies.set
export function serverCookieOptions<T extends BaseCookieOptions>(base?: T): T & Required<BaseCookieOptions> {
  return {
    ...(base ?? {} as T),
    httpOnly: false,
    path: '/',
    sameSite: 'lax',
    secure: SECURE_COOKIES,
    maxAge: SESSION_COOKIE_MAX_AGE,
  }
}

// For the browser client (document.cookie writes cannot be httpOnly)
export function browserCookieOptions<T extends BaseCookieOptions>(base?: T): T & Required<BaseCookieOptions> {
  return {
    ...(base ?? {} as T),
    httpOnly: false,
    path: '/',
    sameSite: 'lax',
    secure: SECURE_COOKIES,
    maxAge: SESSION_COOKIE_MAX_AGE,
  }
}

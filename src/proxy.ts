import { NextResponse, type NextRequest } from 'next/server'
import { resolveAuth } from '@/lib/supabase/gate'

const PUBLIC_PATHS = [
  '/',
  '/auth/signin',
  '/auth/callback',
  '/api/feed/live',
  '/dev-tty',
  '/dev/ui',
  '/projects',
  '/trending',
  '/profile',
  '/api/profile',
  '/api/projects',
  '/api/v1',
]

const isPublicPath = (path: string) => {
  return PUBLIC_PATHS.some(p => path === p || path.startsWith(p + '/'))
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const isPublic = isPublicPath(pathname)
  const isApi = pathname.startsWith('/api/')

  const { identity, cookieUpdates } = await resolveAuth(request)

  if (!identity && !isPublic) {
    const signInUrl = new URL('/auth/signin', request.url)
    signInUrl.searchParams.set('callbackUrl', pathname)
    return cookieUpdates.length
      ? (() => {
          const res = NextResponse.redirect(signInUrl)
          cookieUpdates.forEach(({ name, value, options }) => res.cookies.set(name, value, options))
          return res
        })()
      : NextResponse.redirect(signInUrl)
  }

  // Public non-API requests (plain GET pages) pass straight through.
  if (isPublic && !isApi) {
    if (cookieUpdates.length === 0) return NextResponse.next()
  }

  // Security: never trust client-supplied identity headers — strip anything
  // spoofable before any handler sees it. Only our own resolution can set them.
  const requestHeaders = new Headers(request.headers)
  for (const h of ['x-user-id', 'x-user-login', 'x-user-avatar', 'x-user-email', 'x-auth-id', 'x-github-id']) {
    requestHeaders.delete(h)
  }
  if (identity) {
    // x-user-id is the AUTH UUID: every consumer writes it into uuid columns
    // (auth.users/profiles FKs). The GitHub id gets its own header.
    requestHeaders.set('x-user-id', identity.userId)
    if (identity.githubId) requestHeaders.set('x-github-id', identity.githubId)
    requestHeaders.set('x-user-login', identity.login ?? '')
    requestHeaders.set('x-user-avatar', identity.avatarUrl ?? '')
    if (identity.email) requestHeaders.set('x-user-email', identity.email)
  }

  const response = NextResponse.next({
    request: cookieUpdates.length > 0 || identity ? { headers: requestHeaders } : undefined,
  })
  cookieUpdates.forEach(({ name, value, options }) => response.cookies.set(name, value, options))
  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|.*\\.png$).*)',
  ],
}

import { NextResponse, type NextRequest } from 'next/server'
import { resolveAuth } from '@/lib/supabase/gate'

const PUBLIC_PATHS = [
  '/',
  '/auth/signin',
  '/auth/callback',
  '/api/canvas/feed',
  '/api/feed/live',
  '/dev-tty',
  '/dev/ui',
  '/projects',
  '/trending',
  '/profile',
  '/api/projects',
]

const isPublicPath = (path: string) => {
  return PUBLIC_PATHS.some(p => path === p || path.startsWith(p + '/'))
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (isPublicPath(pathname)) {
    if (request.method === 'GET' || !pathname.startsWith('/api/')) {
      return NextResponse.next()
    }
    const { identity: publicIdentity, cookieUpdates } = await resolveAuth(request)
    if (publicIdentity) {
      const publicHeaders = new Headers(request.headers)
      publicHeaders.set('x-user-id', publicIdentity.githubId ?? publicIdentity.userId)
      publicHeaders.set('x-auth-id', publicIdentity.userId)
      publicHeaders.set('x-user-login', publicIdentity.login ?? '')
      publicHeaders.set('x-user-avatar', publicIdentity.avatarUrl ?? '')
      if (publicIdentity.email) publicHeaders.set('x-user-email', publicIdentity.email)
      const publicResponse = NextResponse.next({ request: { headers: publicHeaders } })
      cookieUpdates.forEach(({ name, value, options }) => publicResponse.cookies.set(name, value, options))
      return publicResponse
    }
    return NextResponse.next()
  }

  const { identity, cookieUpdates } = await resolveAuth(request)
  if (!identity) {
    const signInUrl = new URL('/auth/signin', request.url)
    signInUrl.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(signInUrl)
  }

  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-user-id', identity.githubId ?? identity.userId)
  requestHeaders.set('x-auth-id', identity.userId)
  requestHeaders.set('x-user-login', identity.login ?? '')
  requestHeaders.set('x-user-avatar', identity.avatarUrl ?? '')
  if (identity.email) requestHeaders.set('x-user-email', identity.email)

  const authedResponse = NextResponse.next({ request: { headers: requestHeaders } })
  cookieUpdates.forEach(({ name, value, options }) => authedResponse.cookies.set(name, value, options))
  return authedResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|.*\\.png$).*)',
  ],
}

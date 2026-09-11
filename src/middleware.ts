import { NextResponse, type NextRequest } from 'next/server'
import { getSessionFromRequest, verifySession } from '@/services/totp'

const PUBLIC_PATHS = [
  '/',
  '/auth/login',
  '/auth/register',
  '/auth/totp-login',
  '/auth/totp-setup',
  '/auth/migrate',
  '/auth/forgot-password',
  '/auth/reset-password',
  '/auth/callback',
  '/api/auth/totp-session',
  '/api/auth/totp-verify',
  '/api/auth/totp-logout',
  '/api/auth/me',
  '/projects',
  '/trending',
  '/profile',
]

const isPublicPath = (path: string) => {
  return PUBLIC_PATHS.some(p => path === p || path.startsWith(p + '/'))
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (isPublicPath(pathname)) {
    return NextResponse.next()
  }

  const sessionToken = await getSessionFromRequest(request)
  if (!sessionToken) {
    const loginUrl = new URL('/auth/totp-login', request.url)
    loginUrl.searchParams.set('next', pathname)
    return NextResponse.redirect(loginUrl)
  }

  const payload = await verifySession(sessionToken)
  if (!payload) {
    const loginUrl = new URL('/auth/totp-login', request.url)
    loginUrl.searchParams.set('next', pathname)
    const response = NextResponse.redirect(loginUrl)
    response.headers.append('Set-Cookie', 'totp_session=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0')
    return response
  }

  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-user-id', payload.sub)
  requestHeaders.set('x-user-type', payload.type)
  if (payload.email) requestHeaders.set('x-user-email', payload.email)

  return NextResponse.next({ request: { headers: requestHeaders } })
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|.*\\.png$).*)',
  ],
}
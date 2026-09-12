import { NextResponse, type NextRequest } from 'next/server'
import { auth } from '@/lib/auth'

const PUBLIC_PATHS = [
  '/',
  '/auth/signin',
  '/api/auth',
  '/projects',
  '/trending',
  '/profile',
  '/api/projects',
]

const isPublicPath = (path: string) => {
  return PUBLIC_PATHS.some(p => path === p || path.startsWith(p + '/'))
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (isPublicPath(pathname)) {
    return NextResponse.next()
  }

  const session = await auth()
  if (!session?.user) {
    const signInUrl = new URL('/auth/signin', request.url)
    signInUrl.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(signInUrl)
  }

  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-user-id', String(session.user.githubId))
  requestHeaders.set('x-user-login', session.user.githubLogin)
  requestHeaders.set('x-user-avatar', session.user.avatarUrl)
  if (session.user.email) requestHeaders.set('x-user-email', session.user.email)

  return NextResponse.next({ request: { headers: requestHeaders } })
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|.*\\.png$).*)',
  ],
}
import { NextRequest, NextResponse } from 'next/server'

const SESSION_COOKIE_NAME = 'totp_session'

export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json()
    if (!token) {
      return NextResponse.json({ error: 'Token required' }, { status: 400 })
    }

    const response = NextResponse.json({ success: true })
    response.headers.append('Set-Cookie', [
      `${SESSION_COOKIE_NAME}=${encodeURIComponent(token)}`,
      'HttpOnly',
      'Secure',
      'SameSite=Strict',
      'Path=/',
      `Max-Age=${15 * 60}`,
    ].join('; '))
    return response
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }
}
import { NextResponse } from 'next/server'

const SESSION_COOKIE_NAME = 'totp_session'

export async function POST() {
  const response = NextResponse.json({ success: true })
  response.headers.append('Set-Cookie', [
    `${SESSION_COOKIE_NAME}=`,
    'HttpOnly',
    'Secure',
    'SameSite=Strict',
    'Path=/',
    'Max-Age=0',
  ].join('; '))
  return response
}
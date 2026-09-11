import { NextRequest, NextResponse } from 'next/server'
import { getSessionFromRequest, verifySession } from '@/services/totp'

export async function GET(request: NextRequest) {
  const session = await getSessionFromRequest(request)
  if (!session) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  const payload = await verifySession(session)
  if (!payload) {
    return NextResponse.json({ error: 'Invalid session' }, { status: 401 })
  }

  return NextResponse.json({
    id: payload.sub,
    email: payload.email,
    type: payload.type,
  })
}
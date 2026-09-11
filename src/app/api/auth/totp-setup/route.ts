import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getSessionFromRequest, verifySession } from '@/services/totp'

export async function POST(request: NextRequest) {
  try {
    const sessionToken = await getSessionFromRequest(request)
    if (!sessionToken) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const payload = await verifySession(sessionToken)
    if (!payload) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 })
    }

    const { secret } = await request.json()
    if (!secret) {
      return NextResponse.json({ error: 'Secret required' }, { status: 400 })
    }

    const supabase = await createServerSupabaseClient()
    const { error } = await supabase
      .from('profiles')
      .update({ totp_secret: secret, totp_enabled: true })
      .eq('id', payload.sub)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Failed to save TOTP secret' }, { status: 500 })
  }
}
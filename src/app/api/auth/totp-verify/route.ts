import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { verifyTOTP, verifySharedTOTP, createSession } from '@/services/totp'
import { saveUserTOTPSecret, getUserTOTPSecret, verifyUserTOTP } from '@/services/totp-server'
import { checkRateLimit, getClientKey } from '@/lib/rate-limit'

export async function POST(request: NextRequest) {
  try {
    const { token, email, mode } = await request.json()
    
    if (!token || token.length !== 6) {
      return NextResponse.json({ error: 'Invalid code format' }, { status: 400 })
    }

    const clientKey = getClientKey(request, email || 'shared')
    const rateLimit = checkRateLimit(clientKey)
    
    if (!rateLimit.allowed) {
      return NextResponse.json({ 
        error: 'Too many attempts. Please try again later.',
        retryAfter: Math.ceil((rateLimit.resetAt - Date.now()) / 1000)
      }, { status: 429 })
    }

    let userId: string
    let type: 'user' | 'shared'
    let userEmail: string | undefined

    if (mode === 'shared') {
      if (!verifySharedTOTP(token)) {
        return NextResponse.json({ error: 'Invalid team code' }, { status: 401 })
      }
      userId = 'shared-team'
      type = 'shared'
    } else {
      if (!email) {
        return NextResponse.json({ error: 'Email required' }, { status: 400 })
      }

      const supabase = await createServerSupabaseClient()
      const { data: profile } = await supabase
        .from('profiles')
        .select('id, email, totp_secret, totp_enabled')
        .eq('email', email)
        .maybeSingle()

      if (!profile?.totp_enabled || !profile.totp_secret) {
        return NextResponse.json({ error: 'TOTP not configured for this email' }, { status: 401 })
      }

      if (!verifyTOTP(token, profile.totp_secret)) {
        return NextResponse.json({ error: 'Invalid code' }, { status: 401 })
      }

      userId = profile.id
      type = 'user'
      userEmail = profile.email
    }

    const sessionToken = await createSession(userId, type, userEmail)
    
    const response = NextResponse.json({ success: true })
    response.headers.append('Set-Cookie', [
      `totp_session=${encodeURIComponent(sessionToken)}`,
      'HttpOnly',
      'Secure',
      'SameSite=Strict',
      'Path=/',
      `Max-Age=${15 * 60}`,
    ].join('; '))

    return response
  } catch {
    return NextResponse.json({ error: 'Verification failed' }, { status: 500 })
  }
}
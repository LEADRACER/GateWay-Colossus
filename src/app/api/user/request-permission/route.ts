import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  const userId = request.headers.get('x-user-id')
  const userLogin = request.headers.get('x-user-login')
  const userAvatar = request.headers.get('x-user-avatar')

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = await createServerSupabaseClient()

  // Check if profile exists, create if not
  let { data: profile } = await supabase
    .from('profiles')
    .select('id, role')
    .eq('github_id', userId)
    .single()

  if (!profile) {
    // Create profile from GitHub info
    const { data: newProfile, error: insertError } = await supabase
      .from('profiles')
      .insert({
        github_id: parseInt(userId, 10),
        login: userLogin,
        avatar_url: userAvatar,
        role: 'viewer',
      })
      .select()
      .single()

    if (insertError || !newProfile) {
      return NextResponse.json({ error: 'Failed to create profile' }, { status: 500 })
    }
    profile = newProfile
  }

  if (profile && (profile.role === 'admin' || profile.role === 'member')) {
    return NextResponse.json({ error: 'You already have permission' }, { status: 400 })
  }

  if (!profile) {
    return NextResponse.json({ error: 'Profile not found' }, { status: 400 })
  }

  // Check if already has a pending request
  const { data: existing } = await supabase
    .from('permission_requests')
    .select('id')
    .eq('user_id', profile.id)
    .eq('status', 'pending')
    .maybeSingle()

  if (existing) {
    return NextResponse.json({ error: 'You already have a pending request' }, { status: 400 })
  }

  const { error } = await supabase
    .from('permission_requests')
    .insert({ user_id: profile.id })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json({ success: true })
}
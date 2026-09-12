import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  const session = await auth()

  if (!session?.user?.githubId) {
    return NextResponse.json({ error: 'Not authenticated with GitHub' }, { status: 401 })
  }

  const { email } = await request.json()
  if (!email?.trim()) {
    return NextResponse.json({ error: 'Email required' }, { status: 400 })
  }

  const supabase = await createServerSupabaseClient()
  const githubId = session.user.githubId
  const githubLogin = session.user.githubLogin
  const avatarUrl = session.user.avatarUrl

  // Find existing profile by email
  const { data: existingProfile, error: findError } = await supabase
    .from('profiles')
    .select('*')
    .eq('email', email.toLowerCase())
    .maybeSingle()

  if (findError) {
    return NextResponse.json({ error: 'Database error' }, { status: 500 })
  }

  if (!existingProfile) {
    return NextResponse.json({ error: 'No account found with that email' }, { status: 404 })
  }

  // Check if profile already has a different GitHub ID
  if (existingProfile.github_id && existingProfile.github_id !== githubId) {
    return NextResponse.json({ 
      error: 'This account is already linked to a different GitHub account' 
    }, { status: 400 })
  }

  // Update profile with GitHub info
  const { error: updateError } = await supabase
    .from('profiles')
    .update({
      github_id: githubId,
      login: githubLogin,
      avatar_url: avatarUrl,
      updated_at: new Date().toISOString(),
    })
    .eq('id', existingProfile.id)

  if (updateError) {
    return NextResponse.json({ error: 'Failed to link account' }, { status: 500 })
  }

  // Update projects created by this user
  await supabase
    .from('projects')
    .update({
      created_by_login: githubLogin,
      created_by_avatar: avatarUrl,
    })
    .eq('created_by', existingProfile.id)

  // Update activities
  await supabase
    .from('activities')
    .update({ username: githubLogin, avatar_url: avatarUrl })
    .eq('user_id', existingProfile.id)

  // Update comments
  await supabase
    .from('comments')
    .update({ username: githubLogin, avatar_url: avatarUrl })
    .eq('user_id', existingProfile.id)

  return NextResponse.json({ 
    success: true, 
    message: 'Account linked successfully',
    profileId: existingProfile.id 
  })
}
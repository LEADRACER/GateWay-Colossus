import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const userId = request.headers.get('x-user-id')
  const githubId = request.headers.get('x-github-id')

  if (!userId) {
    return NextResponse.json({ canAdd: false })
  }

  const supabase = await createServerSupabaseClient()

  // Prefer the auth uuid; fall back to github id for legacy sessions.
  const { data: profile } = await (githubId
    ? supabase.from('profiles').select('role, can_add_projects').or(`id.eq.${userId},github_id.eq.${parseInt(githubId, 10)}`)
    : supabase.from('profiles').select('role, can_add_projects').eq('id', userId)
  ).single()

  if (!profile) {
    return NextResponse.json({ canAdd: false })
  }

  const canAdd = profile.role === 'admin' || (profile.role === 'member' && profile.can_add_projects === true)

  return NextResponse.json({ canAdd, role: profile.role })
}
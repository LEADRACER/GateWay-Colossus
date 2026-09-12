import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const userId = request.headers.get('x-user-id')

  if (!userId) {
    return NextResponse.json({ canAdd: false })
  }

  const supabase = await createServerSupabaseClient()

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, can_add_projects')
    .eq('github_id', userId)
    .single()

  if (!profile) {
    return NextResponse.json({ canAdd: false })
  }

  const canAdd = profile.role === 'admin' || (profile.role === 'member' && profile.can_add_projects === true)

  return NextResponse.json({ canAdd, role: profile.role })
}
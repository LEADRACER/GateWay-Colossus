import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const githubId = searchParams.get('githubId')

  if (!githubId) {
    return NextResponse.json({ role: null })
  }

  const supabase = await createServerSupabaseClient()

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('github_id', parseInt(githubId, 10))
    .single()

  return NextResponse.json({ role: profile?.role || null })
}
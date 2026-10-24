import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  const githubId = searchParams.get('githubId')

  if (!id && !githubId) {
    return NextResponse.json({ role: null })
  }

  const supabase = await createServerSupabaseClient()

  // Prefer the auth uuid; legacy sessions fall back to the GitHub id.
  const base = supabase.from('profiles').select('role')
  const { data: profile } = await (id ? base.eq('id', id) : base.eq('github_id', parseInt(githubId ?? '0', 10))).single()

  return NextResponse.json({ role: profile?.role || null })
}
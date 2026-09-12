import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createServerSupabaseClient()

  const { data, error } = await supabase
    .from('projects')
    .select('repo_language')
    .not('repo_language', 'eq', '')
    .order('repo_language', { ascending: true })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const languages = (data || []).map((d: { repo_language: string }) => d.repo_language).filter(Boolean)
  return NextResponse.json(languages)
}
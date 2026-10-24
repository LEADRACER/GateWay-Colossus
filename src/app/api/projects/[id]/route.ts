import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const supabase = await createServerSupabaseClient()
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  return NextResponse.json(data)
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const userId = request.headers.get('x-user-id')

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = await createServerSupabaseClient()

  // Check ownership
  const { data: project } = await supabase
    .from('projects')
    .select('created_by')
    .eq('id', id)
    .single()

  if (!project || project.created_by !== userId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Whitelist columns + validate status — a client must not set
  // team_id / is_showcased / created_by here
  const body = await request.json()
  const updates: Record<string, unknown> = {
    cached_at: new Date().toISOString(),
  }
  for (const key of ['name', 'github_url', 'owner', 'repo_name', 'repo_description', 'repo_readme', 'repo_language', 'repo_topics', 'repo_stars', 'repo_license', 'repo_avatar', 'status'] as const) {
    if (key in body) updates[key] = body[key]
  }
  if (typeof updates.status === 'string' && !['active', 'archived', 'in development'].includes(updates.status)) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('projects')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json(data)
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const userId = _request.headers.get('x-user-id')

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = await createServerSupabaseClient()

  const { data: project } = await supabase
    .from('projects')
    .select('created_by')
    .eq('id', id)
    .single()

  if (!project || project.created_by !== userId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { error } = await supabase.from('projects').delete().eq('id', id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json({ success: true })
}
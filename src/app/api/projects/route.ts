import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { parseGitHubUrl } from '@/services/github'

export async function GET() {
  const supabase = await createServerSupabaseClient()
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

export async function POST(request: Request) {
  const userId = request.headers.get('x-user-id')
  const userLogin = request.headers.get('x-user-login')
  const userAvatar = request.headers.get('x-user-avatar')

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Whitelist columns — a client must not set status/team_id/is_showcased
  const body = await request.json()
  const supabase = await createServerSupabaseClient()

  const projectBody = {
    name: body.name,
    github_url: body.github_url,
    owner: body.owner,
    repo_name: body.repo_name,
    repo_description: body.repo_description,
    repo_readme: body.repo_readme,
    repo_language: body.repo_language,
    repo_topics: body.repo_topics,
    repo_stars: body.repo_stars,
    repo_license: body.repo_license,
    repo_avatar: body.repo_avatar,
    created_by: userId,
    created_by_login: userLogin,
    created_by_avatar: userAvatar,
  }

  if (!projectBody.name?.trim() || !projectBody.github_url?.trim() || !projectBody.owner?.trim() || !projectBody.repo_name?.trim()) {
    return NextResponse.json({ error: 'name, github_url, owner and repo_name are required' }, { status: 400 })
  }

  if (!parseGitHubUrl(projectBody.github_url.trim())) {
    return NextResponse.json({ error: 'github_url must be a GitHub repo URL' }, { status: 400 })
  }
  projectBody.github_url = projectBody.github_url.trim()

  const { data, error } = await supabase
    .from('projects')
    .insert(projectBody)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json(data, { status: 201 })
}
import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { fetchRepoInfo, fetchReadme, parseGitHubUrl } from '@/services/github'

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Check admin role
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'admin') {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
  }

  const body = await request.json()
  const { project_id } = body

  if (!project_id) {
    return NextResponse.json({ error: 'project_id is required' }, { status: 400 })
  }

  // Get the project
  const { data: project, error: projErr } = await supabase
    .from('projects')
    .select('*')
    .eq('id', project_id)
    .single()

  if (projErr || !project) {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 })
  }

  // Validate GitHub URL
  const parsed = parseGitHubUrl(project.github_url)
  if (!parsed) {
    return NextResponse.json({ error: 'Invalid GitHub URL' }, { status: 400 })
  }

  try {
    // Fetch fresh data from GitHub
    const [repoInfo, readme] = await Promise.all([
      fetchRepoInfo(project.github_url),
      fetchReadme(project.github_url),
    ])

    // Update the project
    const { error: updateErr } = await supabase
      .from('projects')
      .update({
        repo_description: repoInfo.description || project.repo_description,
        repo_language: repoInfo.language || project.repo_language,
        repo_topics: repoInfo.topics.length > 0 ? repoInfo.topics : project.repo_topics,
        repo_stars: repoInfo.stargazers_count,
        repo_license: repoInfo.license?.spdx_id || project.repo_license,
        repo_avatar: repoInfo.owner.avatar_url || project.repo_avatar,
        cached_at: new Date().toISOString(),
      })
      .eq('id', project_id)

    // Update README if we got one
    if (readme) {
      const { data: existingReadme } = await supabase
        .from('project_readme')
        .select('id')
        .eq('project_id', project_id)
        .maybeSingle()

      if (existingReadme) {
        await supabase
          .from('project_readme')
          .update({ content: readme })
          .eq('project_id', project_id)
      } else {
        await supabase
          .from('project_readme')
          .insert({ project_id, content: readme })
      }
    }

    if (updateErr) throw updateErr

    // Log sync in sync_jobs
    await supabase.from('sync_jobs').insert({
      user_id: user.id,
      sync_type: 'github_sync',
      status: 'completed',
      metadata: { project_id, repo: `${parsed.owner}/${parsed.repo}`, stars: repoInfo.stargazers_count },
    })

    return NextResponse.json({
      success: true,
      data: {
        repo_stars: repoInfo.stargazers_count,
        repo_language: repoInfo.language,
        repo_topics: repoInfo.topics,
        repo_license: repoInfo.license?.spdx_id,
        cached_at: new Date().toISOString(),
      },
    })
  } catch (err: any) {
    // Log failed sync
    await supabase.from('sync_jobs').insert({
      user_id: user.id,
      sync_type: 'github_sync',
      status: 'failed',
      metadata: { project_id, error: err.message },
    })

    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

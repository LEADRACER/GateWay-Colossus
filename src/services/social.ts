import type { TypedSupabaseClient } from '@/lib/supabase/client'
import type { Like, Bookmark, Comment, Activity, Project } from '@/lib/types/database'

// ── Likes ──────────────────────────────────────────────────────────────

export async function likeProject(client: TypedSupabaseClient, projectId: string, userId: string) {
  const { data, error } = await client
    .from('likes')
    .insert({ project_id: projectId, user_id: userId })
    .select()
    .single()

  if (error) {
    if (error.code === '23505') throw new Error('Already liked')
    throw new Error(error.message)
  }

  await client.from('activities').insert({
    user_id: userId,
    project_id: projectId,
    action: 'project_liked',
  })

  return data as Like
}

export async function unlikeProject(client: TypedSupabaseClient, projectId: string, userId: string) {
  const { error } = await client
    .from('likes')
    .delete()
    .eq('project_id', projectId)
    .eq('user_id', userId)

  if (error) throw new Error(error.message)
}

export async function getLikeCount(client: TypedSupabaseClient, projectId: string): Promise<number> {
  const { data } = await client.rpc('get_like_count', { p_project_id: projectId })
  return data ?? 0
}

export async function getUserLikes(client: TypedSupabaseClient, userId: string): Promise<string[]> {
  const { data, error } = await client
    .from('likes')
    .select('project_id')
    .eq('user_id', userId)

  if (error) throw new Error(error.message)
  return data.map((l) => l.project_id)
}

// ── Bookmarks ──────────────────────────────────────────────────────────

export async function bookmarkProject(client: TypedSupabaseClient, projectId: string, userId: string) {
  const { data, error } = await client
    .from('bookmarks')
    .insert({ project_id: projectId, user_id: userId })
    .select()
    .single()

  if (error) {
    if (error.code === '23505') throw new Error('Already bookmarked')
    throw new Error(error.message)
  }

  await client.from('activities').insert({
    user_id: userId,
    project_id: projectId,
    action: 'project_bookmarked',
  })

  return data as Bookmark
}

export async function unbookmarkProject(client: TypedSupabaseClient, projectId: string, userId: string) {
  const { error } = await client
    .from('bookmarks')
    .delete()
    .eq('project_id', projectId)
    .eq('user_id', userId)

  if (error) throw new Error(error.message)
}

export async function getBookmarkCount(client: TypedSupabaseClient, projectId: string): Promise<number> {
  const { data } = await client.rpc('get_bookmark_count', { p_project_id: projectId })
  return data ?? 0
}

export async function getUserBookmarks(client: TypedSupabaseClient, userId: string): Promise<string[]> {
  const { data, error } = await client
    .from('bookmarks')
    .select('project_id')
    .eq('user_id', userId)

  if (error) throw new Error(error.message)
  return data.map((b) => b.project_id)
}

export async function getUserBookmarkedProjects(client: TypedSupabaseClient, userId: string): Promise<Project[]> {
  const { data, error } = await client
    .from('bookmarks')
    .select('*, projects!inner(*, likes:likes(count), bookmarks:bookmarks(count), comments:comments(count))')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)
  return (data || []).map((b: Bookmark & { projects: Project & { likes?: { count: number }[]; bookmarks?: { count: number }[]; comments?: { count: number }[] } }) => ({
    ...b.projects,
    like_count: b.projects.likes?.[0]?.count ?? 0,
    bookmark_count: b.projects.bookmarks?.[0]?.count ?? 0,
    comment_count: b.projects.comments?.[0]?.count ?? 0,
  }))
}

// ── Comments ───────────────────────────────────────────────────────────

export async function addComment(client: TypedSupabaseClient, projectId: string, content: string, userId: string) {
  const { data, error } = await client
    .from('comments')
    .insert({ project_id: projectId, user_id: userId, content })
    .select()
    .single()

  if (error) throw new Error(error.message)

  await client.from('activities').insert({
    user_id: userId,
    project_id: projectId,
    action: 'comment_added',
  })

  return data as Comment
}

export async function getComments(client: TypedSupabaseClient, projectId: string): Promise<Comment[]> {
  const { data, error } = await client
    .from('comments')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)
  return data as Comment[]
}

export async function getCommentCount(client: TypedSupabaseClient, projectId: string): Promise<number> {
  const { data } = await client.rpc('get_comment_count', { p_project_id: projectId })
  return data ?? 0
}

export async function deleteComment(client: TypedSupabaseClient, commentId: string, userId: string) {
  const { error } = await client
    .from('comments')
    .delete()
    .eq('id', commentId)
    .eq('user_id', userId)

  if (error) throw new Error(error.message)
}

// ── Activity Feed ──────────────────────────────────────────────────────

export async function getActivities(client: TypedSupabaseClient, limit = 20): Promise<Activity[]> {
  const { data, error } = await client
    .from('activities')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) throw new Error(error.message)
  return data as Activity[]
}

export async function getUserActivities(client: TypedSupabaseClient, userId: string, limit = 20): Promise<Activity[]> {
  const { data, error } = await client
    .from('activities')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) throw new Error(error.message)
  return data as Activity[]
}
import type { TypedSupabaseClient } from '@/lib/supabase/client'
import type { Category, FeaturedProject, Project } from '@/lib/types/database'

// ── Categories ────────────────────────────────────────────────────────
export async function getCategories(client: TypedSupabaseClient): Promise<Category[]> {
  const { data, error } = await client
    .from('categories')
    .select('*')
    .order('sort_order', { ascending: true })

  if (error) throw new Error(error.message)
  return data as Category[]
}

export async function setProjectCategories(
  client: TypedSupabaseClient,
  projectId: string,
  categorySlugs: string[],
  userId: string
) {
  // Verify ownership
  const { data: project } = await client
    .from('projects')
    .select('created_by')
    .eq('id', projectId)
    .single()

  if (!project || project.created_by !== userId) {
    throw new Error('Only the project owner can set categories')
  }

  // Delete existing categories
  await client
    .from('project_categories')
    .delete()
    .eq('project_id', projectId)

  if (categorySlugs.length === 0) return

  // Get category IDs
  const { data: categories } = await client
    .from('categories')
    .select('id')
    .in('slug', categorySlugs)

  if (!categories || categories.length === 0) return

  // Insert new categories
  const inserts = categories.map((c: { id: string }) => ({
    project_id: projectId,
    category_id: c.id,
  }))

  const { error } = await client
    .from('project_categories')
    .insert(inserts)

  if (error) throw new Error(error.message)
}

export async function getProjectCategories(
  client: TypedSupabaseClient,
  projectId: string
): Promise<Category[]> {
  const { data, error } = await client
    .from('project_categories')
    .select('categories(*)')
    .eq('project_id', projectId)

  if (error) throw new Error(error.message)
  return ((data || []).flatMap((d) => d.categories ?? []) ?? []) as unknown as Category[]
}

export async function getProjectsByCategory(
  client: TypedSupabaseClient,
  categorySlug: string
): Promise<Project[]> {
  const { data, error } = await client
    .from('project_categories')
    .select('projects(*, likes:likes(count), bookmarks:bookmarks(count), comments:comments(count))')
    .eq('categories.slug', categorySlug)

  if (error) throw new Error(error.message)

  return (data || []).map((d: any) => ({
    ...(Array.isArray(d.projects) ? d.projects[0] : d.projects),
    like_count: d.projects.likes?.[0]?.count ?? 0,
    bookmark_count: d.projects.bookmarks?.[0]?.count ?? 0,
    comment_count: d.projects.comments?.[0]?.count ?? 0,
  }))
}

// ── Trending ───────────────────────────────────────────────────────────
export async function getTrendingProjects(
  client: TypedSupabaseClient,
  limit = 10
): Promise<(Project & { trend_score?: number })[]> {
  const { data, error } = await client.rpc('get_trending_projects', {
    limit_count: limit,
  })

  if (error) throw new Error(error.message)
  return (data || []).map((d: { project_data: Project; trend_score?: number }) => ({
    ...d.project_data,
    trend_score: d.trend_score,
    like_count: 0,
    bookmark_count: 0,
    comment_count: 0,
  }))
}

// ── Featured ───────────────────────────────────────────────────────────
export async function getFeaturedProjects(
  client: TypedSupabaseClient
): Promise<(Project & { featured_note?: string })[]> {
  const { data, error } = await client.rpc('get_featured_projects')

  if (error) throw new Error(error.message)
  return (data || []).map((d: { project_data: Project; note?: string }) => ({
    ...d.project_data,
    featured_note: d.note,
    like_count: 0,
    bookmark_count: 0,
    comment_count: 0,
  }))
}

export async function featureProject(
  client: TypedSupabaseClient,
  projectId: string,
  userId: string,
  note?: string,
  expiresAt?: string
) {
  // Check admin role
  const { data: profile } = await client
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .single()

  if (!profile || profile.role !== 'admin') {
    throw new Error('Only admins can feature projects')
  }

  const { data, error } = await client
    .from('featured_projects')
    .insert({
      project_id: projectId,
      featured_by: userId,
      note,
      expires_at: expiresAt || null,
    })
    .select()
    .single()

  if (error) {
    if (error.code === '23505') throw new Error('Project is already featured')
    throw new Error(error.message)
  }

  return data as FeaturedProject
}

export async function unfeatureProject(client: TypedSupabaseClient, projectId: string, userId: string) {
  const { data: profile } = await client
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .single()

  if (!profile || profile.role !== 'admin') {
    throw new Error('Only admins can unfeature projects')
  }

  const { error } = await client
    .from('featured_projects')
    .delete()
    .eq('project_id', projectId)

  if (error) throw new Error(error.message)
}

// ── Search ─────────────────────────────────────────────────────────────
export async function searchProjects(
  query: string,
  filters?: {
    category?: string
    language?: string
    status?: string
    sort?: 'newest' | 'stars' | 'trending'
  },
  pagination?: {
    offset?: number
    limit?: number
  }
): Promise<Project[]> {
  const params = new URLSearchParams()
  if (query) params.set('q', query)
  if (filters?.language) params.set('language', filters.language)
  if (filters?.status && filters.status !== 'all') params.set('status', filters.status)
  if (filters?.sort) params.set('sort', filters.sort)
  if (pagination?.offset) params.set('offset', String(pagination.offset))
  if (pagination?.limit) params.set('limit', String(pagination.limit))

  const response = await fetch(`/api/projects/search?${params.toString()}`)
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Search failed')
  }
  return response.json()
}

export async function countProjects(
  query: string,
  filters?: {
    language?: string
    status?: string
  }
): Promise<number> {
  const params = new URLSearchParams()
  if (query) params.set('q', query)
  if (filters?.language) params.set('language', filters.language)
  if (filters?.status && filters.status !== 'all') params.set('status', filters.status)

  const response = await fetch(`/api/projects/count?${params.toString()}`)
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Count failed')
  }
  const data = await response.json()
  return data.count
}

// ── Helpers ────────────────────────────────────────────────────────────
export async function getDistinctLanguages(): Promise<string[]> {
  const response = await fetch('/api/projects/languages')
  if (!response.ok) throw new Error('Failed to load languages')
  return response.json()
}
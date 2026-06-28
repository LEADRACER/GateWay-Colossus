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
  categorySlugs: string[]
) {
  const { data: { user } } = await client.auth.getUser()
  if (!user) throw new Error('You must be logged in')

  // Verify ownership
  const { data: project } = await client
    .from('projects')
    .select('created_by')
    .eq('id', projectId)
    .single()

  if (!project || project.created_by !== user.id) {
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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
  note?: string,
  expiresAt?: string
) {
  const { data: { user } } = await client.auth.getUser()
  if (!user) throw new Error('You must be logged in')

  // Check admin role
  const { data: profile } = await client
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'admin') {
    throw new Error('Only admins can feature projects')
  }

  const { data, error } = await client
    .from('featured_projects')
    .insert({
      project_id: projectId,
      featured_by: user.id,
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

export async function unfeatureProject(client: TypedSupabaseClient, projectId: string) {
  const { data: { user } } = await client.auth.getUser()
  if (!user) throw new Error('You must be logged in')

  const { data: profile } = await client
    .from('profiles')
    .select('role')
    .eq('id', user.id)
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
  client: TypedSupabaseClient,
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
  let dbQuery = client
    .from('projects')
    .select('*, likes:likes(count), bookmarks:bookmarks(count), comments:comments(count)')
    .eq('status', filters?.status || 'active')

  // Text search
  if (query) {
    dbQuery = dbQuery.or(
      `name.ilike.%${query}%,repo_description.ilike.%${query}%,owner.ilike.%${query}%,repo_name.ilike.%${query}%`
    )
  }

  // Language filter
  if (filters?.language) {
    dbQuery = dbQuery.eq('repo_language', filters.language)
  }

  // Sort
  if (filters?.sort === 'stars') {
    dbQuery = dbQuery.order('repo_stars', { ascending: false })
  } else {
    dbQuery = dbQuery.order('created_at', { ascending: false })
  }

  const off = pagination?.offset ?? 0
  const lim = pagination?.limit ?? 20
  dbQuery = dbQuery.range(off, off + lim - 1)

  const { data, error } = await dbQuery

  if (error) throw new Error(error.message)

  return (data || []).map((p: Project & { likes?: { count: number }[]; bookmarks?: { count: number }[]; comments?: { count: number }[] }) => ({
    ...p,
    like_count: p.likes?.[0]?.count ?? 0,
    bookmark_count: p.bookmarks?.[0]?.count ?? 0,
    comment_count: p.comments?.[0]?.count ?? 0,
  }))
}

export async function countProjects(
  client: TypedSupabaseClient,
  query: string,
  filters?: {
    language?: string
    status?: string
  }
): Promise<number> {
  let dbQuery = client
    .from('projects')
    .select('id', { count: 'exact', head: true })
    .eq('status', filters?.status || 'active')

  if (query) {
    dbQuery = dbQuery.or(
      `name.ilike.%${query}%,repo_description.ilike.%${query}%,owner.ilike.%${query}%,repo_name.ilike.%${query}%`
    )
  }

  if (filters?.language) {
    dbQuery = dbQuery.eq('repo_language', filters.language)
  }

  const { count, error } = await dbQuery
  if (error) throw new Error(error.message)
  return count ?? 0
}

// ── Helpers ────────────────────────────────────────────────────────────

export async function getDistinctLanguages(client: TypedSupabaseClient): Promise<string[]> {
  const { data, error } = await client
    .from('projects')
    .select('repo_language')
    .not('repo_language', 'eq', '')
    .order('repo_language', { ascending: true })

  if (error) throw new Error(error.message)
  return (data || []).map((d: { repo_language: string }) => d.repo_language).filter(Boolean)
}

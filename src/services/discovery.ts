import type { TypedSupabaseClient } from '@/lib/supabase/client'
import type { Category, Project } from '@/lib/types/database'

// ── Categories ────────────────────────────────────────────────────────
export async function getCategories(client: TypedSupabaseClient): Promise<Category[]> {
  const { data, error } = await client
    .from('categories')
    .select('*')
    .order('sort_order', { ascending: true })

  if (error) throw new Error(error.message)
  return data as Category[]
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
  if (filters?.category) params.set('category', filters.category)
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
    category?: string
    language?: string
    status?: string
  }
): Promise<number> {
  const params = new URLSearchParams()
  if (query) params.set('q', query)
  if (filters?.language) params.set('language', filters.language)
  if (filters?.category) params.set('category', filters.category)
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
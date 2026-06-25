import type { TypedSupabaseClient } from '@/lib/supabase/client'
import type { Profile, Project } from '@/lib/types/database'

// ── Admin check ────────────────────────────────────────────────────────

export async function isAdmin(client: TypedSupabaseClient): Promise<boolean> {
  const { data: { user } } = await client.auth.getUser()
  if (!user) return false

  const { data } = await client
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  return data?.role === 'admin'
}

// ── Dashboard stats ────────────────────────────────────────────────────

export interface AdminStats {
  totalProjects: number
  activeProjects: number
  pendingProjects: number
  totalUsers: number
  newUsersToday: number
  totalLikes: number
  totalComments: number
  totalCategories: number
}

export async function getAdminStats(client: TypedSupabaseClient): Promise<AdminStats> {
  const [projects, users, likes, comments, categories] = await Promise.all([
    client.from('projects').select('status', { count: 'exact' }),
    client.from('profiles').select('id', { count: 'exact' }),
    client.from('likes').select('id', { count: 'exact' }),
    client.from('comments').select('id', { count: 'exact' }),
    client.from('categories').select('id', { count: 'exact' }),
  ])

  const projectData = projects.data || []
  const activeCount = projectData.filter((p: any) => p.status === 'active').length
  const pendingCount = projectData.filter((p: any) => p.status === 'in development').length

  return {
    totalProjects: projects.count ?? projectData.length,
    activeProjects: activeCount,
    pendingProjects: pendingCount,
    totalUsers: users.count ?? 0,
    newUsersToday: 0, // Simplified
    totalLikes: likes.count ?? 0,
    totalComments: comments.count ?? 0,
    totalCategories: categories.count ?? 0,
  }
}

// ── Project moderation ─────────────────────────────────────────────────

export async function moderateProject(
  client: TypedSupabaseClient,
  projectId: string,
  action: 'approve' | 'reject'
) {
  const { data: { user } } = await client.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const newStatus = action === 'approve' ? 'active' : 'archived'

  const { data, error } = await client
    .from('projects')
    .update({ status: newStatus })
    .eq('id', projectId)
    .select()
    .single()

  if (error) throw new Error(error.message)

  // Log activity
  await client.from('activities').insert({
    user_id: user.id,
    project_id: projectId,
    action: action === 'approve' ? 'project_approved' : 'project_rejected',
  })

  return data as Project
}

// ── User management ────────────────────────────────────────────────────

export interface AdminUser {
  id: string
  username: string
  role: 'admin' | 'member' | 'viewer'
  created_at: string
  project_count?: number
}

export async function getAllUsers(client: TypedSupabaseClient): Promise<AdminUser[]> {
  const { data, error } = await client
    .from('profiles')
    .select('*, projects:projects(count)')
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)

  return (data || []).map((u: any) => ({
    id: u.id,
    username: u.username,
    role: u.role,
    created_at: u.created_at,
    project_count: u.projects?.[0]?.count ?? 0,
  }))
}

export async function updateUserRole(
  client: TypedSupabaseClient,
  userId: string,
  newRole: 'admin' | 'member' | 'viewer'
) {
  const { data, error } = await client
    .from('profiles')
    .update({ role: newRole })
    .eq('id', userId)
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data as Profile
}

export async function setUserRole(
  client: TypedSupabaseClient,
  userId: string,
  role: 'admin' | 'member' | 'viewer'
) {
  return updateUserRole(client, userId, role)
}

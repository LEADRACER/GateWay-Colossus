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

// ── Member permission management ────────────────────────────────────────

export interface MemberPermission {
  id: string
  username: string
  role: string
  can_add_projects: boolean
  project_count: number
  created_at: string
}

export async function getMemberPermissions(client: TypedSupabaseClient): Promise<MemberPermission[]> {
  const { data, error } = await client
    .from('profiles')
    .select('id, username, role, can_add_projects, projects:projects(count), created_at')
    .in('role', ['member', 'admin'])
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)
  return (data || []).map((u: any) => ({
    id: u.id,
    username: u.username,
    role: u.role,
    can_add_projects: u.can_add_projects ?? false,
    project_count: u.projects?.[0]?.count ?? 0,
    created_at: u.created_at,
  }))
}

export async function toggleCanAddProject(
  client: TypedSupabaseClient,
  userId: string,
  canAdd: boolean
) {
  const { error } = await client
    .from('profiles')
    .update({ can_add_projects: canAdd })
    .eq('id', userId)

  if (error) throw new Error(error.message)
}

// ── Permission requests ─────────────────────────────────────────────────

export interface PermissionRequest {
  id: string
  user_id: string
  username?: string
  status: 'pending' | 'approved' | 'denied'
  created_at: string
}

export async function getPermissionRequests(client: TypedSupabaseClient): Promise<PermissionRequest[]> {
  const { data, error } = await client
    .from('permission_requests')
    .select('*, profiles!inner(username)')
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) throw new Error(error.message)
  return (data || []).map((r: any) => ({
    id: r.id,
    user_id: r.user_id,
    username: r.profiles?.username,
    status: r.status,
    created_at: r.created_at,
  }))
}

export async function handlePermissionRequest(
  client: TypedSupabaseClient,
  requestId: string,
  action: 'approve' | 'deny'
) {
  // Get the request
  const { data: req, error: reqErr } = await client
    .from('permission_requests')
    .select('*')
    .eq('id', requestId)
    .single()
  if (reqErr || !req) throw new Error('Request not found')

  // Update request status
  const { error: updateErr } = await client
    .from('permission_requests')
    .update({ status: action === 'approve' ? 'approved' : 'denied', updated_at: new Date().toISOString() })
    .eq('id', requestId)
  if (updateErr) throw new Error(updateErr.message)

  // If approved, grant permission
  if (action === 'approve') {
    await toggleCanAddProject(client, req.user_id, true)
  }
}

export async function requestAddProjectPermission(client: TypedSupabaseClient) {
  const { data: { user } } = await client.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  // Check if already has a pending request
  const { data: existing } = await client
    .from('permission_requests')
    .select('id')
    .eq('user_id', user.id)
    .eq('status', 'pending')
    .maybeSingle()
  if (existing) throw new Error('You already have a pending request')

  const { error } = await client
    .from('permission_requests')
    .insert({ user_id: user.id })

  if (error) throw new Error(error.message)
}

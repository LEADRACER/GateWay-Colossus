import type { TypedSupabaseClient } from '@/lib/supabase/client'
import type { Team, TeamMember, TeamJoinRequest, ShowcaseRequest, TeamRole, TeamMemberStatus, JoinRequestStatus } from '@/lib/types/database'

// ============================================================
// HELPERS
// ============================================================

function teamColor(name: string): string {
  const hash = Array.from(name).reduce((a, c) => a + c.charCodeAt(0), 0)
  const hue = (hash * 137) % 360
  return `hsl(${hue}, 70%, 55%)`
}

function generateSlug(name: string, code: string): string {
  const base = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
  return `${base}-${code}`
}

// ============================================================
// TEAMS
// ============================================================

export async function createTeam(
  client: TypedSupabaseClient,
  input: { name: string; description?: string; avatar_url?: string; is_public?: boolean; is_locked?: boolean },
  leaderId: string
): Promise<Team> {
  const { data: team, error } = await client
    .from('teams')
    .insert({
      name: input.name,
      description: input.description,
      avatar_url: input.avatar_url,
      leader_id: leaderId,
      is_public: input.is_public ?? true,
      is_locked: input.is_locked ?? false,
    })
    .select()
    .single()

  if (error) throw new Error(error.message)

  // Add leader as team member
  const { error: memberError } = await client
    .from('team_members')
    .insert({
      team_id: team.id,
      user_id: leaderId,
      role: 'leader',
      status: 'active',
    })

  if (memberError) throw new Error(memberError.message)

  return {
    ...team,
    leader_login: '',
    leader_avatar_url: '',
  } as Team
}

export async function getTeam(
  client: TypedSupabaseClient,
  codeOrSlug: string
): Promise<Team | null> {
  const { data: team } = await client
    .from('teams')
    .select(`
      *,
      leader:profiles!leader_id(login, avatar_url)
    `)
    .or(`code.eq.${codeOrSlug},slug.eq.${codeOrSlug}`)
    .maybeSingle()

  if (!team) return null

  return {
    ...team,
    leader_login: team.leader?.login,
    leader_avatar_url: team.leader?.avatar_url,
  } as Team
}

export async function getTeamById(
  client: TypedSupabaseClient,
  id: string
): Promise<Team | null> {
  const { data: team } = await client
    .from('teams')
    .select(`
      *,
      leader:profiles!leader_id(login, avatar_url)
    `)
    .eq('id', id)
    .maybeSingle()

  if (!team) return null

  return {
    ...team,
    leader_login: team.leader?.login,
    leader_avatar_url: team.leader?.avatar_url,
  } as Team
}

export async function updateTeam(
  client: TypedSupabaseClient,
  teamId: string,
  updates: Partial<Pick<Team, 'name' | 'description' | 'avatar_url' | 'is_locked' | 'is_public'>>,
  userId: string
): Promise<Team> {
  // Verify leadership
  const { data: team } = await client
    .from('teams')
    .select('leader_id')
    .eq('id', teamId)
    .single()

  if (!team || team.leader_id !== userId) {
    throw new Error('Only the team leader can update the team')
  }

  const { data: updated, error } = await client
    .from('teams')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', teamId)
    .select()
    .single()

  if (error) throw new Error(error.message)

  return updated as Team
}

export async function deleteTeam(
  client: TypedSupabaseClient,
  teamId: string,
  userId: string
): Promise<void> {
  const { data: team } = await client
    .from('teams')
    .select('leader_id')
    .eq('id', teamId)
    .single()

  if (!team || team.leader_id !== userId) {
    throw new Error('Only the team leader can delete the team')
  }

  const { error } = await client.from('teams').delete().eq('id', teamId)
  if (error) throw new Error(error.message)
}

export async function listTeams(
  client: TypedSupabaseClient,
  options?: {
    search?: string
    limit?: number
    offset?: number
  }
): Promise<{ teams: Team[]; total: number }> {
  let query = client
    .from('teams')
    .select(`
      *,
      leader:profiles!leader_id(login, avatar_url)
    `, { count: 'exact' })
    .eq('is_public', true)
    .order('created_at', { ascending: false })

  if (options?.search) {
    query = query.ilike('name', `%${options.search}%`)
  }

  if (options?.offset) query = query.range(options.offset, (options.offset || 0) + (options.limit || 20) - 1)
  if (options?.limit) query = query.limit(options.limit)

  const { data, error, count } = await query

  if (error) throw new Error(error.message)

  const teams = (data || []).map(t => ({
    ...t,
    leader_login: t.leader?.login,
    leader_avatar_url: t.leader?.avatar_url,
  })) as Team[]

  return { teams, total: count || 0 }
}

export async function getUserTeams(
  client: TypedSupabaseClient,
  userId: string
): Promise<Team[]> {
  const { data: memberships } = await client
    .from('team_members')
    .select(`
      team:teams(
        *,
        leader:profiles!leader_id(login, avatar_url)
      )
    `)
    .eq('user_id', userId)
    .eq('status', 'active')

  if (!memberships) return []

  return memberships
    .map(m => m.team as any)
    .filter(Boolean)
    .map(t => ({
      ...t,
      leader_login: t.leader?.login,
      leader_avatar_url: t.leader?.avatar_url,
    })) as Team[]
}

// ============================================================
// TEAM MEMBERS
// ============================================================

export async function getTeamMembers(
  client: TypedSupabaseClient,
  teamId: string
): Promise<TeamMember[]> {
  const { data, error } = await client
    .from('team_members')
    .select(`
      *,
      user:profiles!user_id(login, avatar_url, bio)
    `)
    .eq('team_id', teamId)
    .eq('status', 'active')
    .order('role', { ascending: false }) // leader first
    .order('joined_at', { ascending: true })

  if (error) throw new Error(error.message)

  return (data || []).map(m => ({
    ...m,
    login: m.user?.login,
    avatar_url: m.user?.avatar_url,
    bio: m.user?.bio,
  })) as TeamMember[]
}

export async function getTeamMember(
  client: TypedSupabaseClient,
  teamId: string,
  userId: string
): Promise<TeamMember | null> {
  const { data } = await client
    .from('team_members')
    .select(`
      *,
      user:profiles!user_id(login, avatar_url, bio)
    `)
    .eq('team_id', teamId)
    .eq('user_id', userId)
    .maybeSingle()

  if (!data) return null

  return {
    ...data,
    login: data.user?.login,
    avatar_url: data.user?.avatar_url,
    bio: data.user?.bio,
  } as TeamMember
}

export async function inviteMember(
  client: TypedSupabaseClient,
  teamId: string,
  targetUserId: string,
  inviterId: string,
  role: TeamRole = 'member'
): Promise<TeamMember> {
  // Verify inviter has permission
  const inviter = await getTeamMember(client, teamId, inviterId)
  if (!inviter || !['leader', 'admin'].includes(inviter.role)) {
    throw new Error('Only leaders and admins can invite members')
  }

  // Check if already a member
  const existing = await getTeamMember(client, teamId, targetUserId)
  if (existing) {
    if (existing.status === 'active') throw new Error('User is already a member')
    if (existing.status === 'pending') throw new Error('User already has a pending invitation')
    // If rejected/left, allow re-invite by updating
  }

  const { data, error } = await client
    .from('team_members')
    .upsert({
      team_id: teamId,
      user_id: targetUserId,
      role,
      status: 'active',
      invited_by: inviterId,
      joined_at: new Date().toISOString(),
    }, { onConflict: 'team_id,user_id' })
    .select(`
      *,
      user:profiles!user_id(login, avatar_url, bio)
    `)
    .single()

  if (error) throw new Error(error.message)

  return {
    ...data,
    login: data.user?.login,
    avatar_url: data.user?.avatar_url,
    bio: data.user?.bio,
  } as TeamMember
}

export async function updateMemberRole(
  client: TypedSupabaseClient,
  teamId: string,
  targetUserId: string,
  newRole: TeamRole,
  requesterId: string
): Promise<TeamMember> {
  const requester = await getTeamMember(client, teamId, requesterId)
  if (!requester || requester.role !== 'leader') {
    throw new Error('Only the team leader can change roles')
  }

  if (targetUserId === requesterId) {
    throw new Error('Cannot change your own role')
  }

  const target = await getTeamMember(client, teamId, targetUserId)
  if (!target) throw new Error('Member not found')
  if (target.role === 'leader') throw new Error('Cannot change leader role')

  const { data, error } = await client
    .from('team_members')
    .update({ role: newRole })
    .eq('team_id', teamId)
    .eq('user_id', targetUserId)
    .select(`
      *,
      user:profiles!user_id(login, avatar_url, bio)
    `)
    .single()

  if (error) throw new Error(error.message)

  return {
    ...data,
    login: data.user?.login,
    avatar_url: data.user?.avatar_url,
    bio: data.user?.bio,
  } as TeamMember
}

export async function removeMember(
  client: TypedSupabaseClient,
  teamId: string,
  targetUserId: string,
  requesterId: string
): Promise<void> {
  const requester = await getTeamMember(client, teamId, requesterId)
  const target = await getTeamMember(client, teamId, targetUserId)

  if (!target) throw new Error('Member not found')

  // Self-leave
  if (targetUserId === requesterId) {
    if (target.role === 'leader') {
      throw new Error('Leader must transfer ownership before leaving')
    }
    const { error } = await client
      .from('team_members')
      .update({ status: 'left' })
      .eq('team_id', teamId)
      .eq('user_id', targetUserId)
    if (error) throw new Error(error.message)
    return
  }

  // Leader/admin removing someone
  if (!requester || !['leader', 'admin'].includes(requester.role)) {
    throw new Error('Only leaders and admins can remove members')
  }

  if (target.role === 'leader') {
    throw new Error('Cannot remove the team leader')
  }

  const { error } = await client
    .from('team_members')
    .update({ status: 'rejected' })
    .eq('team_id', teamId)
    .eq('user_id', targetUserId)

  if (error) throw new Error(error.message)
}

export async function transferLeadership(
  client: TypedSupabaseClient,
  teamId: string,
  newLeaderId: string,
  currentLeaderId: string
): Promise<void> {
  const currentLeader = await getTeamMember(client, teamId, currentLeaderId)
  if (!currentLeader || currentLeader.role !== 'leader') {
    throw new Error('Only the current leader can transfer leadership')
  }

  const newLeader = await getTeamMember(client, teamId, newLeaderId)
  if (!newLeader || newLeader.status !== 'active') {
    throw new Error('New leader must be an active member')
  }

  // Update team
  const { error: teamError } = await client
    .from('teams')
    .update({ leader_id: newLeaderId, updated_at: new Date().toISOString() })
    .eq('id', teamId)

  if (teamError) throw new Error(teamError.message)

  // Update roles
  const { error: roleError } = await client
    .from('team_members')
    .update({ role: 'leader' })
    .eq('team_id', teamId)
    .eq('user_id', newLeaderId)

  if (roleError) throw new Error(roleError.message)

  // Demote old leader
  await client
    .from('team_members')
    .update({ role: 'admin' })
    .eq('team_id', teamId)
    .eq('user_id', currentLeaderId)
}

// ============================================================
// TEAM JOIN REQUESTS
// ============================================================

export async function requestJoin(
  client: TypedSupabaseClient,
  teamId: string,
  userId: string,
  message?: string
): Promise<TeamJoinRequest> {
  const { data: team } = await client
    .from('teams')
    .select('is_public, is_locked')
    .eq('id', teamId)
    .single()

  if (!team) throw new Error('Team not found')
  if (!team.is_public) throw new Error('This team is private')
  if (team.is_locked) throw new Error('This team is not accepting new members')

  // Check existing membership
  const existingMember = await getTeamMember(client, teamId, userId)
  if (existingMember?.status === 'active') throw new Error('Already a member')
  if (existingMember?.status === 'pending') throw new Error('Invitation pending')

  // Check existing request
  const { data: existingRequest } = await client
    .from('team_join_requests')
    .select('id')
    .eq('team_id', teamId)
    .eq('user_id', userId)
    .eq('status', 'pending')
    .maybeSingle()

  if (existingRequest) throw new Error('Join request already pending')

  const { data, error } = await client
    .from('team_join_requests')
    .insert({
      team_id: teamId,
      user_id: userId,
      message,
    })
    .select(`
      *,
      user:profiles!user_id(login, avatar_url),
      team:teams!team_id(name, code)
    `)
    .single()

  if (error) throw new Error(error.message)

  return {
    ...data,
    login: data.user?.login,
    avatar_url: data.user?.avatar_url,
    team_name: data.team?.name,
    team_code: data.team?.code,
  } as TeamJoinRequest
}

export async function getJoinRequests(
  client: TypedSupabaseClient,
  teamId: string,
  status?: JoinRequestStatus
): Promise<TeamJoinRequest[]> {
  let query = client
    .from('team_join_requests')
    .select(`
      *,
      user:profiles!user_id(login, avatar_url),
      team:teams!team_id(name, code)
    `)
    .eq('team_id', teamId)
    .order('created_at', { ascending: false })

  if (status) query = query.eq('status', status)

  const { data, error } = await query

  if (error) throw new Error(error.message)

  return (data || []).map(r => ({
    ...r,
    login: r.user?.login,
    avatar_url: r.user?.avatar_url,
    team_name: r.team?.name,
    team_code: r.team?.code,
  })) as TeamJoinRequest[]
}

export async function acceptJoinRequest(
  client: TypedSupabaseClient,
  requestId: string,
  reviewerId: string
): Promise<TeamJoinRequest> {
  const { data: request } = await client
    .from('team_join_requests')
    .select('team_id, user_id')
    .eq('id', requestId)
    .single()

  if (!request) throw new Error('Request not found')

  const reviewer = await getTeamMember(client, request.team_id, reviewerId)
  if (!reviewer || !['leader', 'admin'].includes(reviewer.role)) {
    throw new Error('Only leaders and admins can accept requests')
  }

  // Add as member
  await inviteMember(client, request.team_id, request.user_id, reviewerId, 'member')

  // Update request
  const { data, error } = await client
    .from('team_join_requests')
    .update({
      status: 'accepted',
      reviewed_by: reviewerId,
      reviewed_at: new Date().toISOString(),
    })
    .eq('id', requestId)
    .select(`
      *,
      user:profiles!user_id(login, avatar_url),
      team:teams!team_id(name, code)
    `)
    .single()

  if (error) throw new Error(error.message)

  return {
    ...data,
    login: data.user?.login,
    avatar_url: data.user?.avatar_url,
    team_name: data.team?.name,
    team_code: data.team?.code,
  } as TeamJoinRequest
}

export async function rejectJoinRequest(
  client: TypedSupabaseClient,
  requestId: string,
  reviewerId: string
): Promise<TeamJoinRequest> {
  const { data: request } = await client
    .from('team_join_requests')
    .select('team_id')
    .eq('id', requestId)
    .single()

  if (!request) throw new Error('Request not found')

  const reviewer = await getTeamMember(client, request.team_id, reviewerId)
  if (!reviewer || !['leader', 'admin'].includes(reviewer.role)) {
    throw new Error('Only leaders and admins can reject requests')
  }

  const { data, error } = await client
    .from('team_join_requests')
    .update({
      status: 'rejected',
      reviewed_by: reviewerId,
      reviewed_at: new Date().toISOString(),
    })
    .eq('id', requestId)
    .select(`
      *,
      user:profiles!user_id(login, avatar_url),
      team:teams!team_id(name, code)
    `)
    .single()

  if (error) throw new Error(error.message)

  return {
    ...data,
    login: data.user?.login,
    avatar_url: data.user?.avatar_url,
    team_name: data.team?.name,
    team_code: data.team?.code,
  } as TeamJoinRequest
}

export async function getUserJoinRequests(
  client: TypedSupabaseClient,
  userId: string
): Promise<TeamJoinRequest[]> {
  const { data, error } = await client
    .from('team_join_requests')
    .select(`
      *,
      user:profiles!user_id(login, avatar_url),
      team:teams!team_id(name, code)
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)

  return (data || []).map(r => ({
    ...r,
    login: r.user?.login,
    avatar_url: r.user?.avatar_url,
    team_name: r.team?.name,
    team_code: r.team?.code,
  })) as TeamJoinRequest[]
}

// ============================================================
// SEARCH USERS (for invites)
// ============================================================

export async function searchUsers(
  client: TypedSupabaseClient,
  query: string,
  limit = 10
): Promise<{ id: string; login: string; avatar_url?: string }[]> {
  if (!query || query.length < 2) return []

  const { data, error } = await client
    .from('profiles')
    .select('id, login, avatar_url')
    .ilike('login', `%${query}%`)
    .limit(limit)

  if (error) throw new Error(error.message)
  return data || []
}

// ============================================================
// TEAM PROJECTS
// ============================================================

export async function getTeamProjects(
  client: TypedSupabaseClient,
  teamId: string,
  options?: { limit?: number; offset?: number }
): Promise<{ projects: any[]; total: number }> {
  let query = client
    .from('projects')
    .select('*, likes:likes(count), bookmarks:bookmarks(count), comments:comments(count)', { count: 'exact' })
    .eq('team_id', teamId)
    .eq('status', 'active')
    .order('created_at', { ascending: false })

  if (options?.offset) query = query.range(options.offset, options.offset + (options.limit || 20) - 1)
  if (options?.limit) query = query.limit(options.limit || 20)

  const { data, error, count } = await query

  if (error) throw new Error(error.message)

  const projects = (data || []).map(p => ({
    ...p,
    like_count: p.likes?.[0]?.count ?? 0,
    bookmark_count: p.bookmarks?.[0]?.count ?? 0,
    comment_count: p.comments?.[0]?.count ?? 0,
  }))

  return { projects, total: count || 0 }
}

// ============================================================
// SHOWCASE REQUESTS
// ============================================================

export async function createShowcaseRequest(
  client: TypedSupabaseClient,
  projectId: string,
  requestedBy: string,
  type: 'homepage' | 'fired' | 'both'
): Promise<ShowcaseRequest> {
  // Verify project exists and user has permission
  const { data: project } = await client
    .from('projects')
    .select('created_by, team_id')
    .eq('id', projectId)
    .single()

  if (!project) throw new Error('Project not found')

  const isCreator = project.created_by === requestedBy
  let isTeamLeader = false

  if (project.team_id) {
    const membership = await getTeamMember(client, project.team_id, requestedBy)
    isTeamLeader = !!membership && ['leader', 'admin'].includes(membership.role)
  }

  if (!isCreator && !isTeamLeader) {
    throw new Error('Only the project creator or team leaders can request showcase')
  }

  const { data, error } = await client
    .from('showcase_requests')
    .insert({
      project_id: projectId,
      requested_by: requestedBy,
      type,
    })
    .select(`
      *,
      project:projects!project_id(name, owner, repo_name),
      requester:profiles!requested_by(login),
      team:teams!projects(team_id, name, code)
    `)
    .single()

  if (error) {
    if (error.code === '23505') throw new Error('Showcase request already exists for this project')
    throw new Error(error.message)
  }

  return {
    ...data,
    project_name: data.project?.name,
    project_owner: data.project?.owner,
    requester_login: data.requester?.login,
    team_name: data.team?.name,
    team_code: data.team?.code,
  } as ShowcaseRequest
}

export async function getShowcaseRequests(
  client: TypedSupabaseClient,
  options?: { status?: 'pending' | 'approved' | 'rejected'; limit?: number; offset?: number }
): Promise<{ requests: ShowcaseRequest[]; total: number }> {
  let query = client
    .from('showcase_requests')
    .select(`
      *,
      project:projects!project_id(name, owner, repo_name),
      requester:profiles!requested_by(login),
      team:teams!projects(team_id, name, code)
    `, { count: 'exact' })
    .order('created_at', { ascending: false })

  if (options?.status) query = query.eq('status', options.status)
  if (options?.offset) query = query.range(options.offset, options.offset + (options.limit || 20) - 1)
  if (options?.limit) query = query.limit(options.limit || 20)

  const { data, error, count } = await query

  if (error) throw new Error(error.message)

  const requests = (data || []).map(r => ({
    ...r,
    project_name: r.project?.name,
    project_owner: r.project?.owner,
    requester_login: r.requester?.login,
    team_name: r.team?.name,
    team_code: r.team?.code,
  })) as ShowcaseRequest[]

  return { requests, total: count || 0 }
}

export async function reviewShowcaseRequest(
  client: TypedSupabaseClient,
  requestId: string,
  adminId: string,
  action: 'approve' | 'reject',
  adminNotes?: string
): Promise<ShowcaseRequest> {
  // Verify admin
  const { data: admin } = await client
    .from('profiles')
    .select('role')
    .eq('id', adminId)
    .single()

  if (!admin || admin.role !== 'admin') {
    throw new Error('Only admins can review showcase requests')
  }

  const { data: request } = await client
    .from('showcase_requests')
    .select('project_id, status')
    .eq('id', requestId)
    .single()

  if (!request) throw new Error('Request not found')
  if (request.status !== 'pending') throw new Error('Request already reviewed')

  const newStatus = action === 'approve' ? 'approved' : 'rejected'

  const { data, error } = await client
    .from('showcase_requests')
    .update({
      status: newStatus,
      reviewed_by: adminId,
      reviewed_at: new Date().toISOString(),
      admin_notes: adminNotes,
    })
    .eq('id', requestId)
    .select(`
      *,
      project:projects!project_id(name, owner, repo_name),
      requester:profiles!requested_by(login),
      team:teams!projects(team_id, name, code)
    `)
    .single()

  if (error) throw new Error(error.message)

  return {
    ...data,
    project_name: data.project?.name,
    project_owner: data.project?.owner,
    requester_login: data.requester?.login,
    team_name: data.team?.name,
    team_code: data.team?.code,
  } as ShowcaseRequest
}

export async function revokeShowcase(
  client: TypedSupabaseClient,
  projectId: string,
  adminId: string
): Promise<void> {
  const { data: admin } = await client
    .from('profiles')
    .select('role')
    .eq('id', adminId)
    .single()

  if (!admin || admin.role !== 'admin') {
    throw new Error('Only admins can revoke showcases')
  }

  const { error } = await client
    .from('showcase_requests')
    .update({ status: 'rejected' })
    .eq('project_id', projectId)
    .eq('status', 'approved')

  if (error) throw new Error(error.message)
}
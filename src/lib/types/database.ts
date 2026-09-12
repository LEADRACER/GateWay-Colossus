export interface Profile {
  id: string
  github_id: number
  login: string
  avatar_url?: string
  bio?: string
  role: 'admin' | 'member' | 'viewer'
  can_add_projects?: boolean
  created_at: string
  updated_at: string
}

export interface Project {
  id: string
  name: string
  github_url: string
  owner: string
  repo_name: string
  repo_description?: string
  repo_readme?: string
  repo_language?: string
  repo_topics?: string[]
  repo_stars: number
  repo_license?: string
  repo_avatar?: string
  status: 'active' | 'archived' | 'in development'
  created_by: string
  created_by_login?: string
  created_by_avatar?: string
  team_id?: string
  is_team_project: boolean
  cached_at?: string
  created_at: string
  updated_at: string
  // Aggregated counts (computed via API)
  like_count?: number
  bookmark_count?: number
  comment_count?: number
  user_has_liked?: boolean
  user_has_bookmarked?: boolean
}

export type ProjectStatus = Project['status']
export type UserRole = Profile['role']

export interface Like {
  id: string
  user_id: string
  project_id: string
  created_at: string
}

export interface Bookmark {
  id: string
  user_id: string
  project_id: string
  created_at: string
}

export interface Comment {
  id: string
  user_id: string
  project_id: string
  content: string
  created_at: string
  updated_at: string
  // Joined fields
  username?: string
  avatar_url?: string
}

export interface Category {
  id: string
  name: string
  slug: string
  description?: string
  icon?: string
  sort_order: number
  created_at: string
}

export interface FeaturedProject {
  id: string
  project_id: string
  featured_by: string
  note?: string
  starts_at: string
  expires_at?: string
  created_at: string
}

export type ActivityAction =
  | 'project_created'
  | 'project_liked'
  | 'project_bookmarked'
  | 'comment_added'
  | 'project_submitted'
  | 'project_approved'
  | 'project_rejected'

export interface Activity {
  id: string
  user_id: string
  action: ActivityAction
  project_id?: string
  metadata: Record<string, unknown>
  created_at: string
  // Joined fields
  username?: string
  avatar_url?: string
  project_name?: string
}

export interface APIKey {
  id: string
  user_id: string
  name: string
  key_hash: string
  key_prefix: string
  scopes: string[]
  rate_limit: number
  last_used_at?: string
  expires_at?: string
  is_active: boolean
  created_at: string
}

export interface Webhook {
  id: string
  user_id: string
  url: string
  secret: string
  events: string[]
  is_active: boolean
  last_triggered_at?: string
  last_status?: number
  failure_count: number
  created_at: string
}

// ============================================================
// TEAMING SYSTEM
// ============================================================

export type TeamRole = 'leader' | 'admin' | 'member'
export type TeamMemberStatus = 'pending' | 'active' | 'rejected' | 'left'
export type JoinRequestStatus = 'pending' | 'accepted' | 'rejected'
export type ShowcaseType = 'homepage' | 'fired' | 'both'
export type ShowcaseStatus = 'pending' | 'approved' | 'rejected'

export interface Team {
  id: string
  name: string
  slug: string
  code: string
  description?: string
  avatar_url?: string
  leader_id: string
  is_locked: boolean
  is_public: boolean
  member_count: number
  created_at: string
  updated_at: string
  // Joined fields
  leader_login?: string
  leader_avatar_url?: string
}

export interface TeamMember {
  id: string
  team_id: string
  user_id: string
  role: TeamRole
  status: TeamMemberStatus
  invited_by?: string
  joined_at: string
  // Joined fields
  login?: string
  avatar_url?: string
  bio?: string
}

export interface TeamJoinRequest {
  id: string
  team_id: string
  user_id: string
  message?: string
  status: JoinRequestStatus
  reviewed_by?: string
  reviewed_at?: string
  created_at: string
  // Joined fields
  login?: string
  avatar_url?: string
  team_name?: string
  team_code?: string
}

export interface ShowcaseRequest {
  id: string
  project_id: string
  requested_by: string
  type: ShowcaseType
  status: ShowcaseStatus
  admin_notes?: string
  reviewed_by?: string
  reviewed_at?: string
  created_at: string
  // Joined fields
  project_name?: string
  project_owner?: string
  requester_login?: string
  team_name?: string
  team_code?: string
}
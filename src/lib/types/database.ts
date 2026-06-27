export interface Profile {
  id: string
  member_id?: number
  username: string
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

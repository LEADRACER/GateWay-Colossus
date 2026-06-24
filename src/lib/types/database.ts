export interface Profile {
  id: string
  member_id?: number
  username: string
  avatar_url?: string
  bio?: string
  role: 'admin' | 'member' | 'viewer'
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
}

export type ProjectStatus = Project['status']
export type UserRole = Profile['role']

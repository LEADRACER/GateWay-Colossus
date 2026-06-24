import type { TypedSupabaseClient } from '@/lib/supabase/client'
import type { Project, ProjectStatus } from '@/lib/types/database'

const TABLE = 'projects'
const SELECT = '*'

export async function listProjects(client: TypedSupabaseClient) {
  const { data, error } = await client
    .from(TABLE)
    .select(SELECT)
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)
  return data as Project[]
}

export async function getProject(client: TypedSupabaseClient, id: string) {
  const { data, error } = await client
    .from(TABLE)
    .select(SELECT)
    .eq('id', id)
    .single()

  if (error) throw new Error(error.message)
  return data as Project
}

export interface CreateProjectInput {
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
}

export async function createProject(client: TypedSupabaseClient, input: CreateProjectInput) {
  const { data: { user }, error: userError } = await client.auth.getUser()
  if (userError || !user) throw new Error('You must be logged in to create a project')

  const { data, error } = await client
    .from(TABLE)
    .insert({
      ...input,
      created_by: user.id,
      cached_at: new Date().toISOString(),
    })
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data as Project
}

export async function updateProject(
  client: TypedSupabaseClient,
  id: string,
  updates: Partial<CreateProjectInput & { status: ProjectStatus }>,
) {
  const { data, error } = await client
    .from(TABLE)
    .update({ ...updates, cached_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data as Project
}

export async function deleteProject(client: TypedSupabaseClient, id: string) {
  const { error } = await client.from(TABLE).delete().eq('id', id)
  if (error) throw new Error(error.message)
}

export async function listProjectsByUser(client: TypedSupabaseClient, userId: string) {
  const { data, error } = await client
    .from(TABLE)
    .select(SELECT)
    .eq('created_by', userId)
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)
  return data as Project[]
}

export async function refreshProjectCache(client: TypedSupabaseClient, id: string, repoData: CreateProjectInput) {
  const { data, error } = await client
    .from(TABLE)
    .update({ ...repoData, cached_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data as Project
}

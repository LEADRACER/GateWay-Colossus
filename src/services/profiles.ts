import type { TypedSupabaseClient } from '@/lib/supabase/client'
import type { Profile } from '@/lib/types/database'

export async function getProfile(
  client: TypedSupabaseClient,
  id: string,
) {
  const { data, error } = await client
    .from('profiles')
    .select('*')
    .eq('id', id)
    .single()

  if (error) throw new Error(error.message)
  return data as Profile
}

export async function updateProfile(
  client: TypedSupabaseClient,
  id: string,
  updates: Partial<Pick<Profile, 'username' | 'bio' | 'avatar_url'>>,
) {
  const { data, error } = await client
    .from('profiles')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data as Profile
}

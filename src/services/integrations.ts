import type { TypedSupabaseClient } from '@/lib/supabase/client'

const TABLE = 'api_keys'

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

// ── API Keys ───────────────────────────────────────────────────────────

export async function listAPIKeys(client: TypedSupabaseClient): Promise<APIKey[]> {
  const { data, error } = await client
    .from(TABLE)
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)
  return data as APIKey[]
}

export async function createAPIKey(
  client: TypedSupabaseClient,
  name: string,
  scopes: string[] = ['read:projects'],
  rateLimit = 100
): Promise<{ key: APIKey; rawKey: string }> {
  const { data: { user } } = await client.auth.getUser()
  if (!user) throw new Error('You must be logged in')

  // Generate a random API key
  const rawKey = 'gwc_' + Array.from({ length: 32 }, () =>
    'abcdefghijklmnopqrstuvwxyz0123456789'[Math.floor(Math.random() * 36)]
  ).join('')

  // Hash the key for storage (simple hash — in production use bcrypt)
  const keyHash = await hashKey(rawKey)
  const keyPrefix = rawKey.slice(0, 12)

  const { data, error } = await client
    .from(TABLE)
    .insert({
      user_id: user.id,
      name,
      key_hash: keyHash,
      key_prefix: keyPrefix,
      scopes,
      rate_limit: rateLimit,
    })
    .select()
    .single()

  if (error) throw new Error(error.message)

  return { key: data as APIKey, rawKey }
}

export async function deleteAPIKey(client: TypedSupabaseClient, keyId: string) {
  const { error } = await client
    .from(TABLE)
    .delete()
    .eq('id', keyId)

  if (error) throw new Error(error.message)
}

// ── Webhooks ───────────────────────────────────────────────────────────

const WEBHOOK_TABLE = 'webhooks'

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

export async function listWebhooks(client: TypedSupabaseClient): Promise<Webhook[]> {
  const { data, error } = await client
    .from(WEBHOOK_TABLE)
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)
  return data as Webhook[]
}

export async function createWebhook(
  client: TypedSupabaseClient,
  url: string,
  events: string[]
): Promise<{ webhook: Webhook; secret: string }> {
  const { data: { user } } = await client.auth.getUser()
  if (!user) throw new Error('You must be logged in')

  // Generate webhook secret
  const secret = Array.from({ length: 32 }, () =>
    'abcdefghijklmnopqrstuvwxyz0123456789'[Math.floor(Math.random() * 36)]
  ).join('')

  const { data, error } = await client
    .from(WEBHOOK_TABLE)
    .insert({
      user_id: user.id,
      url,
      secret,
      events,
    })
    .select()
    .single()

  if (error) throw new Error(error.message)

  return { webhook: data as Webhook, secret }
}

export async function deleteWebhook(client: TypedSupabaseClient, webhookId: string) {
  const { error } = await client
    .from(WEBHOOK_TABLE)
    .delete()
    .eq('id', webhookId)

  if (error) throw new Error(error.message)
}

// ── Helpers ────────────────────────────────────────────────────────────

async function hashKey(key: string): Promise<string> {
  // Simple hash using SubtleCrypto (available in browser and Node 18+)
  const encoder = new TextEncoder()
  const data = encoder.encode(key)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

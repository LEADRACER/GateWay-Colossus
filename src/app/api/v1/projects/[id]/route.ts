import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

// ── Rate Limiting ──────────────────────────────────────────────────────
const rateLimitMap = new Map<string, { count: number; resetAt: number }>()

function checkRateLimit(key: string, limit: number, windowMs: number = 3600000): boolean {
  const now = Date.now()
  const entry = rateLimitMap.get(key)
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(key, { count: 1, resetAt: now + windowMs })
    return true
  }
  if (entry.count >= limit) return false
  entry.count++
  return true
}

async function authenticateAPIKey(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) return null
  const token = authHeader.slice(7)
  if (!token.startsWith('gwc_')) return null

  const encoder = new TextEncoder()
  const data = encoder.encode(token)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  const keyHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')

  // api_keys is owner-RLS locked — look it up via security-definer rpc
  const supabase = await createServerSupabaseClient()
  const { data: found } = await supabase.rpc('lookup_api_key', { p_hash: keyHash }).single()

  const apiKey = (found as {
    key_id: string
    key_user_id: string
    key_name: string | null
    key_scopes: string[] | null
    key_rate_limit: number | null
    key_expires_at: string | null
  } | null) ? {
    id: (found as { key_id: string }).key_id,
    user_id: (found as { key_user_id: string }).key_user_id,
    name: (found as { key_name: string | null }).key_name,
    scopes: (found as { key_scopes: string[] | null }).key_scopes,
    rate_limit: (found as { key_rate_limit: number | null }).key_rate_limit ?? 100,
    expires_at: (found as { key_expires_at: string | null }).key_expires_at,
  } : null

  if (!apiKey) return null
  if (apiKey.expires_at && new Date(apiKey.expires_at) < new Date()) return null

  const allowed = checkRateLimit(apiKey.id, apiKey.rate_limit)
  if (!allowed) return { error: 'Rate limit exceeded', status: 429 }

  return apiKey
}

// ── Public API: /api/v1/projects/[id] ─────────────────────────────────
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await authenticateAPIKey(request)
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (auth && 'error' in auth) return NextResponse.json({ error: (auth as { error: string }).error }, { status: (auth as { status: number }).status })

  const { id } = await params
  const supabase = await createServerSupabaseClient()

  const { data, error } = await supabase
    .from('projects')
    .select('*, comments(content, created_at), likes:likes(count), bookmarks:bookmarks(count)')
    .eq('id', id)
    .single()

  if (error) {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 })
  }

  return NextResponse.json({ data })
}

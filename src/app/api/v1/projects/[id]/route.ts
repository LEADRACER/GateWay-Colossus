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

  const supabase = await createServerSupabaseClient()
  const { data: apiKey } = await supabase
    .from('api_keys')
    .select('*')
    .eq('key_hash', keyHash)
    .eq('is_active', true)
    .single()

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
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status })

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

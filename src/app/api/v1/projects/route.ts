import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

// ── Rate Limiting (in-memory, per-instance) ────────────────────────────
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

// ── API Key Authentication ─────────────────────────────────────────────
async function authenticateAPIKey(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) return null

  const token = authHeader.slice(7)
  if (!token.startsWith('gwc_')) return null

  // Hash the provided key and compare
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

  // Check expiry
  if (apiKey.expires_at && new Date(apiKey.expires_at) < new Date()) return null

  // Rate limit check
  const allowed = checkRateLimit(apiKey.id, apiKey.rate_limit)
  if (!allowed) return { error: 'Rate limit exceeded', status: 429 }

  // Update last_used
  await supabase
    .from('api_keys')
    .update({ last_used_at: new Date().toISOString() })
    .eq('id', apiKey.id)

  return apiKey
}

// ── Public API: /api/v1/projects ───────────────────────────────────────
export async function GET(request: NextRequest) {
  // Authenticate
  const auth = await authenticateAPIKey(request)
  if (!auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  const supabase = await createServerSupabaseClient()

  // Parse query params
  const searchParams = request.nextUrl.searchParams
  const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100)
  const offset = parseInt(searchParams.get('offset') || '0')
  const status = searchParams.get('status') || 'active'
  const language = searchParams.get('language')
  const sort = searchParams.get('sort') || 'created_at'

  let query = supabase
    .from('projects')
    .select('id, name, github_url, owner, repo_name, repo_description, repo_language, repo_topics, repo_stars, repo_license, status, created_at, updated_at')
    .eq('status', status)
    .order(sort === 'stars' ? 'repo_stars' : 'created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (language) {
    query = query.eq('repo_language', language)
  }

  const { data, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({
    data,
    meta: {
      limit,
      offset,
      count: data?.length || 0,
    },
  })
}

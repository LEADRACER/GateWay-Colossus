import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { createShowcaseRequest } from '@/services/teams'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const userId = request.headers.get('x-user-id')

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json().catch(() => null)
  if (!body) return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  const { type } = body as { type?: 'homepage' | 'fired' | 'both' }
  if (!type || !['homepage', 'fired', 'both'].includes(type)) {
    return NextResponse.json({ error: 'Invalid showcase type' }, { status: 400 })
  }

  const supabase = await createServerSupabaseClient()

  try {
    const request = await createShowcaseRequest(supabase, id, userId, type)
    return NextResponse.json(request, { status: 201 })
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Failed to create showcase request'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
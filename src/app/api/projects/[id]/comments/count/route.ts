import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getCommentCount } from '@/services/social'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const supabase = await createServerSupabaseClient()

  const count = await getCommentCount(supabase, id)

  return NextResponse.json({ count })
}
import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createServerSupabaseClient()
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

export async function POST(request: Request) {
  const userId = request.headers.get('x-user-id')
  const userLogin = request.headers.get('x-user-login')
  const userAvatar = request.headers.get('x-user-avatar')

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const supabase = await createServerSupabaseClient()

  const { data, error } = await supabase
    .from('projects')
    .insert({
      ...body,
      created_by: userId,
      created_by_login: userLogin,
      created_by_avatar: userAvatar,
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json(data, { status: 201 })
}
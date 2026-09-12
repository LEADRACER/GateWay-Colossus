import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getAllUsers } from '@/services/admin'

export async function GET() {
  const supabase = await createServerSupabaseClient()

  const users = await getAllUsers(supabase)

  return NextResponse.json(users)
}
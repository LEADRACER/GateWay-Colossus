import { createServerSupabaseClient } from '@/lib/supabase/server'
import { verifyTOTP } from '@/services/totp'

export async function saveUserTOTPSecret(userId: string, secret: string): Promise<void> {
  const supabase = await createServerSupabaseClient()
  const { error } = await supabase
    .from('profiles')
    .update({ totp_secret: secret, totp_enabled: true })
    .eq('id', userId)
  if (error) throw new Error(error.message)
}

export async function getUserTOTPSecret(userId: string): Promise<string | null> {
  const supabase = await createServerSupabaseClient()
  const { data, error } = await supabase
    .from('profiles')
    .select('totp_secret, totp_enabled')
    .eq('id', userId)
    .maybeSingle()
  if (error) throw new Error(error.message)
  return data?.totp_enabled ? data.totp_secret : null
}

export async function disableUserTOTP(userId: string): Promise<void> {
  const supabase = await createServerSupabaseClient()
  const { error } = await supabase
    .from('profiles')
    .update({ totp_secret: null, totp_enabled: false })
    .eq('id', userId)
  if (error) throw new Error(error.message)
}

export async function verifyUserTOTP(userId: string, token: string): Promise<boolean> {
  const secret = await getUserTOTPSecret(userId)
  if (!secret) return false
  return verifyTOTP(token, secret)
}
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { isAdmin } from '@/services/admin'
import type { Profile } from '@/lib/types/database'
import AdminLayout from '@/components/layout/AdminLayout'
import { Spinner } from '@/components/ui/Spinner'

interface AdminGuardProps {
  children: React.ReactNode
}

export default function AdminGuard({ children }: AdminGuardProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<Profile | null>(null)

  useEffect(() => {
    const check = async () => {
      const supabase = createClient()
      const admin = await isAdmin(supabase)
      if (!admin) {
        router.push('/projects')
        return
      }
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: prof } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()
        setProfile(prof)
      }
      setLoading(false)
    }
    check()
  }, [router])

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <Spinner size="lg" />
      </div>
    )
  }

  if (!profile) return null

  return <AdminLayout profile={profile}>{children}</AdminLayout>
}

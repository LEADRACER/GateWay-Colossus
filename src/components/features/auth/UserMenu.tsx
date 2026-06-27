'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'

export function UserMenu() {
  const [user, setUser] = useState<{ email?: string } | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { createClient } = await import('@/lib/supabase/client')
      const { data: { user } } = await createClient().auth.getUser()
      setUser(user)
      setLoading(false)
    }
    load()
  }, [])

  const handleSignOut = async () => {
    const { createClient } = await import('@/lib/supabase/client')
    const { signOut } = await import('@/services/auth')
    await signOut(createClient())
    window.location.href = '/'
  }

  if (loading) return <Spinner size="sm" />

  if (!user) {
    return (
      <a href="/auth/login">
        <Button variant="secondary" size="sm">Sign In</Button>
      </a>
    )
  }

  return (
    <div className="flex items-center gap-3">
      <a href="/bookmarks" className="text-sm text-[#a3a3a3] hover:text-text transition-colors">Bookmarks</a>
      <span className="text-sm text-[#a3a3a3]">{user.email}</span>
      <Button variant="ghost" size="sm" onClick={handleSignOut}>
        Sign Out
      </Button>
    </div>
  )
}

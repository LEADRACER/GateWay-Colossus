'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'

export function Header() {
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await createClient().auth.getUser()
      setUser(user)
      setLoading(false)
    }
    load()
  }, [])

  const handleSignOut = async () => {
    const { signOut } = await import('@/services/auth')
    await signOut(createClient())
    window.location.href = '/'
  }

  return (
    <header className="border-b border-[#333] bg-[#0a0a0a]">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <a href="/" className="text-lg font-bold tracking-tight text-[#f5f5f5]">
          GateWay:<span className="text-[#00ff41]">Colossus</span>
        </a>
        <nav className="flex items-center gap-6 text-sm text-[#a3a3a3]">
          <a href="/projects" className="hover:text-[#f5f5f5] transition-colors">
            Projects
          </a>

          {loading ? (
            <Spinner size="sm" />
          ) : user ? (
            <div className="flex items-center gap-3">
            <a
              href={`/profile/${user.id}`}
              className="text-[#a3a3a3] hover:text-[#f5f5f5] transition-colors"
            >
              {user.email}
            </a>
              <Button variant="ghost" size="sm" onClick={handleSignOut}>
                Sign Out
              </Button>
            </div>
          ) : (
            <a href="/auth/login" className="hover:text-[#f5f5f5] transition-colors">
              Sign In
            </a>
          )}
        </nav>
      </div>
    </header>
  )
}

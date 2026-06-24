'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'

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
    <header className="border-b border-border bg-bg/80 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
        <a
          href="/"
          className="text-base font-semibold tracking-tight text-text"
        >
          GateWay:<span className="text-accent">Colossus</span>
        </a>

        <nav className="flex items-center gap-1 text-sm">
          <a
            href="/projects"
            className="px-3 py-1.5 rounded-md text-text-muted hover:text-text hover:bg-surface-alt transition-colors"
          >
            Projects
          </a>

          {loading ? (
            <div className="h-4 w-4 rounded-full border border-border border-t-accent animate-spin ml-2" />
          ) : user ? (
            <div className="flex items-center gap-1 ml-2">
              <a
                href={`/profile/${user.id}`}
                className="px-3 py-1.5 rounded-md text-text-muted hover:text-text hover:bg-surface-alt transition-colors"
              >
                {user.email?.split('@')[0] ?? 'Profile'}
              </a>
              <Button variant="ghost" size="sm" onClick={handleSignOut}>
                Sign Out
              </Button>
            </div>
          ) : (
            <a
              href="/auth/login"
              className="ml-2 px-3 py-1.5 rounded-md text-text-muted hover:text-text hover:bg-surface-alt transition-colors"
            >
              Sign In
            </a>
          )}
        </nav>
      </div>
    </header>
  )
}

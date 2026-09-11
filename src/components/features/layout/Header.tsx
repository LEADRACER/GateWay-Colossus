'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/Button'
import Link from 'next/link'

export function Header() {
  const [user, setUser] = useState<{ id: string; email?: string; type: 'user' | 'shared' } | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/auth/me')
        if (res.ok) {
          const data = await res.json()
          setUser(data)
        }
      } catch {
        // Not authenticated
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const handleSignOut = async () => {
    await fetch('/api/auth/totp-logout', { method: 'POST' })
    window.location.href = '/'
  }

  return (
    <header className="border-b border-border bg-bg/80 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
        <Link
          href="/"
          className="text-base font-semibold tracking-tight text-text"
        >
          GateWay:<span className="text-accent">Colossus</span>
        </Link>

        <nav className="flex items-center gap-1 text-sm">
          <Link
            href="/projects"
            className="px-3 py-1.5 rounded-md text-text-muted hover:text-text hover:bg-surface-alt transition-colors"
          >
            Projects
          </Link>

          {loading ? (
            <div className="h-4 w-4 rounded-full border border-border border-t-accent animate-spin ml-2" />
          ) : user ? (
            <div className="flex items-center gap-1 ml-2">
              {user.type === 'user' && (
                <>
                  <a
                    href="/bookmarks"
                    className="px-3 py-1.5 rounded-md text-text-muted hover:text-text hover:bg-surface-alt transition-colors"
                  >
                    Bookmarks
                  </a>
                  <a
                    href={`/profile/${user.id}`}
                    className="px-3 py-1.5 rounded-md text-text-muted hover:text-text hover:bg-surface-alt transition-colors"
                  >
                    {user.email?.split('@')[0] ?? 'Profile'}
                  </a>
                </>
              )}
              <Button variant="ghost" size="sm" onClick={handleSignOut}>
                Sign Out
              </Button>
            </div>
          ) : (
            <a
              href="/auth/totp-login"
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
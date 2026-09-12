'use client'

import Link from 'next/link'
import { UserMenu } from '@/components/features/auth/UserMenu'

export function Header() {
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

          <UserMenu />
        </nav>
      </div>
    </header>
  )
}
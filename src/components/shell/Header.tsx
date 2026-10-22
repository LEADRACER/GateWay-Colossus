'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { UserMenu } from '@/components/features/auth/UserMenu'
import { CommandPalette } from '@/components/shell/CommandPalette'
import { COPY } from './copy'

const NAV = [
  { href: '/projects', label: COPY.nav.projects },
  { href: '/teams', label: COPY.nav.teams },
  { href: '/trending', label: COPY.nav.trending },
]

export function Header() {
  const pathname = usePathname()

  return (
    <header className="border-b border-border bg-bg sticky top-0 z-40">
      <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
        <Link
          href="/"
          className="font-mono text-sm font-semibold tracking-tight text-text"
        >
          {COPY.brand.line1}
          <span className="text-gold">:</span>
          <span className="text-green-bright">{COPY.brand.line2}</span>
        </Link>

        <nav className="flex items-center gap-1 text-sm">
          {NAV.map((item) => {
            const active = pathname.startsWith(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`px-3 py-1.5 rounded-none transition-colors font-mono text-xs uppercase tracking-[0.06em] ${
                  active
                    ? 'text-green-bright border-b-2 border-gold'
                    : 'text-text-muted hover:text-text hover:bg-surface-alt'
                }`}
              >
                {item.label}
              </Link>
            )
          })}
          <kbd
            className="hidden sm:inline-flex ml-2 h-7 items-center gap-1 border border-border px-2 font-mono text-[10px] text-text-dim"
            title="command palette"
          >
            ⌘K
          </kbd>
          <UserMenu />
        </nav>
      </div>
      <CommandPalette />
    </header>
  )
}

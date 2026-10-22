'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { UserMenu } from '@/components/features/auth/UserMenu'
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
                className={`px-3 py-1.5 rounded-md transition-colors ${
                  active
                    ? 'text-text border-b-2 border-green'
                    : 'text-text-muted hover:text-text hover:bg-surface-alt'
                }`}
              >
                {item.label}
              </Link>
            )
          })}
          <UserMenu />
        </nav>
      </div>
    </header>
  )
}

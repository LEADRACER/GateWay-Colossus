'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { getCategories } from '@/services/discovery'
import type { Category } from '@/lib/types/database'

const iconMap: Record<string, string> = {
  globe: 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zM2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z',
  terminal: 'M4 17l6-6-6-6M12 19h8',
  smartphone: 'M12 18h.01M8 21h8a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2z',
  'book-open': 'M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2zM22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z',
  server: 'M2 4h20v6H2zM2 14h20v6H2zM6 7h.01M6 17h.01',
  brain: 'M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 1.98-3A2.5 2.5 0 0 1 9.5 2zM14.5 2A2.5 2.5 0 0 1 17 4.5v15a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-1.98-3A2.5 2.5 0 0 0 14.5 2z',
  'gamepad-2': 'M6 12h4m-2-2v4M18 13h.01M16 11h.01M14 12h.01',
  shield: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z',
  database: 'M12 2C6.48 2 2 4.02 2 6.5v11C2 19.98 6.48 22 12 22s10-2.02 10-4.5v-11C22 4.02 17.52 2 12 2zM2 9.5C2 11.98 6.48 14 12 14s10-2.02 10-4.5S17.52 5 12 5 2 7.02 2 9.5z',
  cpu: 'M9 1v3M15 1v3M9 20v3M15 20v3M1 9h3M1 15h3M20 9h3M20 15h3M4 4h16v16H4z',
}

interface CategoryNavProps {
  selected: string | null
  onSelect: (slug: string | null) => void
}

export function CategoryNav({ selected, onSelect }: CategoryNavProps) {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()
    getCategories(supabase)
      .then(setCategories)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex gap-2 overflow-x-auto pb-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-8 w-20 rounded-lg bg-surface-alt animate-pulse" />
        ))}
      </div>
    )
  }

  return (
    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
      <button
        onClick={() => onSelect(null)}
        className={`shrink-0 px-3 py-1.5 text-sm rounded-lg transition-all duration-150 ${
          selected === null
            ? 'bg-accent text-[#050505] font-medium'
            : 'bg-surface-alt text-text-muted hover:text-text border border-transparent hover:border-border'
        }`}
      >
        All
      </button>
      {categories.map((cat) => (
        <button
          key={cat.slug}
          onClick={() => onSelect(selected === cat.slug ? null : cat.slug)}
          className={`shrink-0 px-3 py-1.5 text-sm rounded-lg transition-all duration-150 flex items-center gap-1.5 ${
            selected === cat.slug
              ? 'bg-accent text-[#050505] font-medium'
              : 'bg-surface-alt text-text-muted hover:text-text border border-transparent hover:border-border'
          }`}
        >
          {cat.icon && (
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d={iconMap[cat.icon] || ''} />
            </svg>
          )}
          {cat.name}
        </button>
      ))}
    </div>
  )
}

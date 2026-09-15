'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { Search, ChevronLeft, ChevronRight } from 'lucide-react'
import { TeamCard } from './TeamCard'
import { EmptyState } from '@/components/ui/EmptyState'
import { Spinner } from '@/components/ui/Spinner'
import type { Team } from '@/lib/types/database'

interface TeamListProps {
  initialTeams?: Team[]
  initialTotal?: number
  searchable?: boolean
  onSearch?: (query: string) => void
}

export function TeamList({ initialTeams = [], initialTotal = 0, searchable = true, onSearch }: TeamListProps) {
  const [teams, setTeams] = useState<Team[]>(initialTeams)
  const [total, setTotal] = useState(initialTotal)
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)
  const PAGE_SIZE = 20
  const totalPages = Math.ceil(total / PAGE_SIZE) || 1

  useEffect(() => {
    if (searchTimeout.current) clearTimeout(searchTimeout.current)
    searchTimeout.current = setTimeout(() => {
      setDebouncedSearch(search)
      setPage(1)
      onSearch?.(search)
    }, 300)
    return () => { if (searchTimeout.current) clearTimeout(searchTimeout.current) }
  }, [search, onSearch])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (debouncedSearch) params.set('search', debouncedSearch)
      params.set('limit', String(PAGE_SIZE))
      params.set('offset', String((page - 1) * PAGE_SIZE))

      const response = await fetch(`/api/teams?${params.toString()}`)
      if (response.ok) {
        const data = await response.json()
        setTeams(data.teams)
        setTotal(data.total)
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false)
    }
  }, [debouncedSearch, page])

  useEffect(() => {
    let mounted = true
    load().then(() => {})
    return () => { mounted = false }
  }, [load])

  const goPage = (p: number) => {
    if (p < 1 || p > totalPages) return
    setPage(p)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const getPageNumbers = () => {
    const pages: (number | '...')[] = []
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i)
    } else {
      pages.push(1)
      if (page > 3) pages.push('...')
      const start = Math.max(2, page - 1)
      const end = Math.min(totalPages - 1, page + 1)
      for (let i = start; i <= end; i++) pages.push(i)
      if (page < totalPages - 2) pages.push('...')
      pages.push(totalPages)
    }
    return pages
  }

  if (loading && teams.length === 0) {
    return (
      <div className="flex justify-center items-center py-24">
        <Spinner size="lg" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {searchable && (
        <div className="relative max-w-md">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-dim" aria-hidden="true" />
          <input
            type="text"
            placeholder="Search teams..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-border bg-surface text-text placeholder:text-text-dim/50 focus:outline-none focus:border-accent/50 transition-colors"
          />
        </div>
      )}

      {teams.length === 0 ? (
        <EmptyState
          title={debouncedSearch ? 'No teams found' : 'No teams yet'}
          description={debouncedSearch ? 'Try adjusting your search.' : 'Be the first to create a team.'}
        />
      ) : (
        <>
          <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))' }}>
            {teams.map((team) => (
              <TeamCard key={team.id} team={team} />
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 mt-8 pt-6 border-t border-border">
              <button
                onClick={() => goPage(page - 1)}
                disabled={page <= 1}
                className="p-2 rounded-lg border border-border bg-surface text-text hover:bg-surface-alt disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                aria-label="Previous page"
              >
                <ChevronLeft size={18} />
              </button>

              {getPageNumbers().map((p, i) =>
                p === '...' ? (
                  <span key={`dot-${i}`} className="px-2 text-text-dim">{p}</span>
                ) : (
                  <button
                    key={p}
                    onClick={() => goPage(p)}
                    className={`w-10 h-10 rounded-lg font-medium transition-all ${
                      p === page
                        ? 'bg-accent text-white border border-accent'
                        : 'bg-surface border border-border text-text-muted hover:bg-surface-alt'
                    }`}
                  >
                    {p}
                  </button>
                )
              )}

              <button
                onClick={() => goPage(page + 1)}
                disabled={page >= totalPages}
                className="p-2 rounded-lg border border-border bg-surface text-text hover:bg-surface-alt disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                aria-label="Next page"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
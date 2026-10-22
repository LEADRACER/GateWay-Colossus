'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import Link from 'next/link'
import { useSupabaseSession as useSession } from '@/hooks/useSupabaseSession'
import { searchProjects, getDistinctLanguages, countProjects } from '@/services/discovery'
import { ProjectCard } from '@/components/features/project/ProjectCard'
import { CategoryNav } from '@/components/ui/CategoryNav'
import { Spinner } from '@/components/ui/Spinner'
import { EmptyState } from '@/components/ui/EmptyState'
import { ErrorMessage } from '@/components/ui/ErrorMessage'
import type { Project } from '@/lib/types/database'
import { Stagger, StaggerRow } from '@/components/motion'
import { COPY } from '@/components/shell/copy'
import { Search, SlidersHorizontal, X, ChevronLeft, ChevronRight } from 'lucide-react'

const statusOptions = ['all', 'active', 'in development', 'archived'] as const
const PAGE_SIZE = 20

export default function ProjectsPage() {
  const { data: session, status } = useSession()
  const [projects, setProjects] = useState<Project[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null)
  const [languageFilter, setLanguageFilter] = useState<string>('')
  const [languages, setLanguages] = useState<string[]>([])
  const [showFilters, setShowFilters] = useState(false)
  const [canAdd, setCanAdd] = useState(false)
  const [userRole, setUserRole] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [debouncedSearch, setDebouncedSearch] = useState('')

  const totalPages = Math.ceil(total / PAGE_SIZE) || 1

  // Debounce search input
  useEffect(() => {
    if (searchTimeout.current) clearTimeout(searchTimeout.current)
    searchTimeout.current = setTimeout(() => {
      setDebouncedSearch(search)
      setPage(1)
    }, 250)
    return () => { if (searchTimeout.current) clearTimeout(searchTimeout.current) }
  }, [search])

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const offset = (page - 1) * PAGE_SIZE

      const [data, count] = await Promise.all([
        searchProjects(debouncedSearch, {
          language: languageFilter || undefined,
          status: statusFilter !== 'all' ? statusFilter : undefined,
        }, { offset, limit: PAGE_SIZE }),
        countProjects(debouncedSearch, {
          language: languageFilter || undefined,
          status: statusFilter !== 'all' ? statusFilter : undefined,
        }),
      ])
      setProjects(data as Project[])
      setTotal(count)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }, [debouncedSearch, statusFilter, languageFilter, page])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load()
  }, [load])

  useEffect(() => {
    getDistinctLanguages().then(setLanguages).catch(() => {})
  }, [])

  useEffect(() => {
    if (session?.user) {
      setUserRole(session.user.role || null) // eslint-disable-line react-hooks/set-state-in-effect
      if (!session.user.role) {
        fetch(`/api/user/role?githubId=${session.user.githubId}`)
          .then(res => res.json())
          .then(data => {
            if (data.role) setUserRole(data.role)
          })
          .catch(() => {})
      }
    }
  }, [session])

  const checkCanAdd = useCallback(async () => {
    if (!session?.user) return
    try {
      const response = await fetch('/api/user/can-add-project')
      if (response.ok) {
        const data = await response.json()
        setCanAdd(data.canAdd)
      }
    } catch {
      // silently fail
    }
  }, [session])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    checkCanAdd()
  }, [checkCanAdd])

  const hasFilters = categoryFilter || languageFilter || statusFilter !== 'all'

  function clearFilters() {
    setSearch('')
    setCategoryFilter(null)
    setLanguageFilter('')
    setStatusFilter('all')
    setPage(1)
  }

  function goPage(p: number) {
    if (p < 1 || p > totalPages) return
    setPage(p)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function getPageNumbers(): (number | '...')[] {
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

  if (status === 'loading') {
    return (
      <div className="max-w-6xl mx-auto px-6 py-12 md:py-16">
        <div className="flex justify-center items-center min-h-[60vh]">
          <Spinner size="lg" />
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-12 md:py-16">
      <div className="flex items-center justify-between flex-wrap gap-3 mb-6">
        <div>
          <h1 className="font-mono text-2xl md:text-3xl font-bold text-text tracking-tight">
            {COPY.nav.projects.toLowerCase()}
          </h1>
          <p className="font-mono text-xs text-text-dim mt-1.5">
            {total} record{total !== 1 ? 's' : ''} in the index
          </p>
        </div>
        <div className="flex gap-3 items-center">
          {canAdd ? (
            <Link
              href="/projects/new"
              className="inline-flex items-center gap-2 h-10 px-4 bg-green text-text-on-accent font-mono text-xs uppercase tracking-[0.08em] hover:bg-green-dim transition-colors"
            >
              + {COPY.nav.newProject.toLowerCase()}
            </Link>
          ) : userRole === 'member' ? (
            <RequestPermissionButton />
          ) : null}
          <div className="relative">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-dim" />
            <input
              type="text"
              placeholder="search the index…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-52 bg-bg-raised border border-border px-3 py-2 pl-8 font-mono text-xs text-text placeholder:text-text-dim focus:outline-none focus:border-green/60 transition-colors"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`inline-flex items-center gap-2 h-10 px-3 border font-mono text-xs uppercase tracking-[0.08em] transition-colors cursor-pointer ${
              showFilters
                ? 'border-gold/60 text-gold bg-gold-subtle'
                : 'border-border text-text-muted hover:text-text hover:border-border-light'
            }`}
          >
            <SlidersHorizontal size={14} />
            filters
            {hasFilters && <span className="w-1.5 h-1.5 bg-gold" />}
          </button>
        </div>
      </div>


      <div style={{ marginBottom: 16 }}>
        <CategoryNav selected={categoryFilter} onSelect={setCategoryFilter} />
      </div>

      {showFilters && (
        <div className="p-4 rounded-none border border-border bg-bg-raised mb-5 flex gap-x-4 gap-y-3 flex-wrap items-end">
          <div>
            <label className="font-mono text-[10px] uppercase tracking-[0.08em] text-text-dim block mb-1.5">status</label>
            <select
              value={statusFilter}
              onChange={e => { setStatusFilter(e.target.value); setPage(1) }}
              className="bg-bg border border-border px-3 py-2 font-mono text-xs text-text focus:outline-none focus:border-green/60 cursor-pointer"
            >
              {statusOptions.map(slot => (
                <option key={slot} value={slot}>{slot === 'all' ? 'all' : slot}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="font-mono text-[10px] uppercase tracking-[0.08em] text-text-dim block mb-1.5">language</label>
            <select
              value={languageFilter}
              onChange={e => { setLanguageFilter(e.target.value); setPage(1) }}
              className="bg-bg border border-border px-3 py-2 font-mono text-xs text-text focus:outline-none focus:border-green/60 cursor-pointer"
            >
              <option value="">all</option>
              {languages.map(l => (
                <option key={l} value={l}>{l}</option>
              ))}
            </select>
          </div>

          {hasFilters && (
            <button
              onClick={clearFilters}
              className="inline-flex items-center gap-1.5 px-3 py-2 border border-border font-mono text-xs text-text-muted hover:text-text hover:border-border-light transition-colors cursor-pointer ml-auto"
            >
              <X size={12} /> clear
            </button>
          )}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center min-h-[60vh]">
          <Spinner size="lg" />
        </div>
      ) : error ? (
        <ErrorMessage message={error} />
      ) : projects.length === 0 ? (
        <EmptyState
          title={hasFilters || debouncedSearch ? 'No matching projects' : 'No projects yet'}
          description={hasFilters || debouncedSearch ? 'Try adjusting your search or filters.' : 'Be the first to showcase your project.'}
        />
      ) : (
        <>
          <Stagger className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map((proj) => (
              <StaggerRow key={proj.id}>
                <ProjectCard project={proj} />
              </StaggerRow>
            ))}
          </Stagger>

          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-1.5 mt-8 pt-6 border-t border-border font-mono text-xs">
              <button
                onClick={() => goPage(page - 1)}
                disabled={page <= 1}
                aria-label="previous page"
                className="px-2.5 h-8 border border-border text-text flex items-center disabled:opacity-40 disabled:cursor-not-allowed hover:border-border-light transition-colors"
              >
                <ChevronLeft size={14} />
              </button>

              {getPageNumbers().map((num, i) =>
                num === '...' ? (
                  <span key={`dot-${i}`} className="px-1 text-text-dim">···</span>
                ) : (
                  <button
                    key={num}
                    onClick={() => goPage(num)}
                    className={`w-8 h-8 border tabular-nums cursor-pointer transition-colors ${
                      num === page
                        ? 'border-green text-green-bright bg-green-subtle'
                        : 'border-transparent text-text-muted hover:text-text hover:bg-surface-alt'
                    }`}
                  >
                    {num}
                  </button>
                )
              )}

              <button
                onClick={() => goPage(page + 1)}
                disabled={page >= totalPages}
                aria-label="next page"
                className="px-2.5 h-8 border border-border text-text flex items-center disabled:opacity-40 disabled:cursor-not-allowed hover:border-border-light transition-colors"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}

function RequestPermissionButton() {
  const [requesting, setRequesting] = useState(false)
  const [done, setDone] = useState(false)
  const [err, setErr] = useState('')

  async function handleRequest() {
    setRequesting(true)
    setErr('')
    try {
      const response = await fetch('/api/user/request-permission', { method: 'POST' })
      if (!response.ok) throw new Error('Failed to request permission')
      setDone(true)
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : 'Something went wrong')
    } finally {
      setRequesting(false)
    }
  }

  if (done) {
    return (
      <span className="inline-flex items-center gap-2 h-10 px-4 border border-green/40 bg-green-subtle text-green-bright font-mono text-xs whitespace-nowrap">
        ✓ request sent — admin will review
      </span>
    )
  }

  return (
    <span className="inline-flex items-center gap-2">
      <button
        onClick={handleRequest}
        disabled={requesting}
        className="inline-flex items-center gap-2 h-10 px-4 border border-green/50 text-green-bright font-mono text-xs uppercase tracking-[0.08em] disabled:opacity-50 hover:bg-green-subtle transition-colors"
      >
        {requesting ? 'sending…' : (
          <>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
            request permission
          </>
        )}
      </button>
      {err && <span className="font-mono text-xs text-error">{err}</span>}
    </span>
  )
}
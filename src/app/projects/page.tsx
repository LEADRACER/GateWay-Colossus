'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { searchProjects, getDistinctLanguages, countProjects } from '@/services/discovery'
import { requestAddProjectPermission } from '@/services/admin'
import { ProjectCard } from '@/components/features/project/ProjectCard'
import { CategoryNav } from '@/components/ui/CategoryNav'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'
import { EmptyState } from '@/components/ui/EmptyState'
import { ErrorMessage } from '@/components/ui/ErrorMessage'
import type { Project } from '@/lib/types/database'
import { Search, SlidersHorizontal, X, ChevronLeft, ChevronRight } from 'lucide-react'

const statusOptions = ['all', 'active', 'in development', 'archived'] as const
const PAGE_SIZE = 20

export default function ProjectsPage() {
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
  const [user, setUser] = useState<{ id: string } | null>(null)
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
      const supabase = createClient()
      const offset = (page - 1) * PAGE_SIZE

      const [data, count] = await Promise.all([
        searchProjects(supabase, debouncedSearch, {
          language: languageFilter || undefined,
          status: statusFilter !== 'all' ? statusFilter : undefined,
        }, { offset, limit: PAGE_SIZE }),
        countProjects(supabase, debouncedSearch, {
          language: languageFilter || undefined,
          status: statusFilter !== 'all' ? statusFilter : undefined,
        }),
      ])
      setProjects(data as Project[])
      setTotal(count)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [debouncedSearch, categoryFilter, statusFilter, languageFilter, page])

  useEffect(() => { load() }, [load])

  useEffect(() => {
    const supabase = createClient()
    getDistinctLanguages(supabase).then(setLanguages).catch(() => {})
  }, [])

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(async ({ data }) => {
      setUser(data.user)
      if (data.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role, can_add_projects')
          .eq('id', data.user.id)
          .single()
        if (profile) {
          setUserRole(profile.role)
          setCanAdd(profile.role === 'admin' || (profile.role === 'member' && profile.can_add_projects === true))
        }
      }
    })
  }, [])

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

  return (
    <div className="max-w-6xl mx-auto px-6 py-12 md:py-16">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 700, color: 'var(--color-text)', margin: 0, letterSpacing: '-0.02em' }}>
            Projects
          </h1>
          <p style={{ fontSize: 14, color: 'var(--color-text-muted)', margin: '4px 0 0' }}>
            {total} project{total !== 1 ? 's' : ''} found
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {canAdd ? (
          <Link href="/projects/new">
            <button
              style={{
                padding: '8px 14px', borderRadius: 8,
                background: 'var(--color-accent)',
                color: '#fff',
                border: 'none',
                cursor: 'pointer', fontSize: 13, fontWeight: 600,
                display: 'flex', alignItems: 'center', gap: 6,
                transition: 'opacity 0.15s',
              }}
              onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
              onMouseLeave={e => e.currentTarget.style.opacity = '1'}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              Add Project
            </button>
          </Link>
          ) : userRole === 'member' ? (
            <RequestPermissionButton />
          ) : null}
          <div style={{ position: 'relative' }}>
            <Search size={14} color="var(--color-text-dim)" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)' }} />
            <input type="text" placeholder="Search projects..." value={search}
              onChange={e => setSearch(e.target.value)}
              style={{
                padding: '8px 12px 8px 30px', borderRadius: 8,
                border: '1px solid var(--color-border)',
                background: 'var(--color-surface)',
                fontSize: 13, color: 'var(--color-text)',
                outline: 'none', width: 220,
                transition: 'border-color 0.15s',
              }}
              onFocus={e => e.target.style.borderColor = 'var(--color-accent)'}
              onBlur={e => e.target.style.borderColor = 'var(--color-border)'}
            />
          </div>
          <button onClick={() => setShowFilters(!showFilters)}
            style={{
              padding: '8px 12px', borderRadius: 8,
              border: `1px solid ${showFilters ? 'var(--color-accent)' : 'var(--color-border)'}`,
              background: showFilters ? 'var(--color-accent-bg)' : 'var(--color-surface)',
              color: showFilters ? 'var(--color-accent)' : 'var(--color-text-muted)',
              cursor: 'pointer', fontSize: 13,
              display: 'flex', alignItems: 'center', gap: 6,
              transition: 'all 0.15s',
            }}>
            <SlidersHorizontal size={14} />
            Filters
            {hasFilters && (
              <span style={{
                width: 6, height: 6, borderRadius: '50%',
                background: 'var(--color-accent)',
              }} />
            )}
          </button>
        </div>
      </div>

      {/* Category nav */}
      <div style={{ marginBottom: 16 }}>
        <CategoryNav selected={categoryFilter} onSelect={setCategoryFilter} />
      </div>

      {/* Advanced filters panel */}
      {showFilters && (
        <div style={{
          padding: 16, borderRadius: 12,
          border: '1px solid var(--color-border)',
          background: 'var(--color-surface)',
          marginBottom: 20,
          display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center',
        }}>
          {/* Status filter */}
          <div>
            <label style={{ fontSize: 11, color: 'var(--color-text-dim)', display: 'block', marginBottom: 4, fontWeight: 500 }}>
              Status
            </label>
            <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1) }}
              style={{
                padding: '6px 10px', borderRadius: 6,
                border: '1px solid var(--color-border)',
                background: 'var(--color-surface-2)',
                fontSize: 12, color: 'var(--color-text)',
                outline: 'none', cursor: 'pointer',
              }}>
              {statusOptions.map(s => (
                <option key={s} value={s}>{s === 'all' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}</option>
              ))}
            </select>
          </div>

          {/* Language filter */}
          <div>
            <label style={{ fontSize: 11, color: 'var(--color-text-dim)', display: 'block', marginBottom: 4, fontWeight: 500 }}>
              Language
            </label>
            <select value={languageFilter} onChange={e => { setLanguageFilter(e.target.value); setPage(1) }}
              style={{
                padding: '6px 10px', borderRadius: 6,
                border: '1px solid var(--color-border)',
                background: 'var(--color-surface-2)',
                fontSize: 12, color: 'var(--color-text)',
                outline: 'none', cursor: 'pointer',
              }}>
              <option value="">All</option>
              {languages.map(l => (
                <option key={l} value={l}>{l}</option>
              ))}
            </select>
          </div>

          {hasFilters && (
            <button onClick={clearFilters}
              style={{
                padding: '6px 12px', borderRadius: 6,
                border: '1px solid var(--color-border)',
                background: 'var(--color-surface-2)',
                color: 'var(--color-text-muted)',
                cursor: 'pointer', fontSize: 12,
                display: 'flex', alignItems: 'center', gap: 4,
                marginLeft: 'auto',
              }}>
              <X size={12} /> Clear
            </button>
          )}
        </div>
      )}

      {/* Results */}
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
          <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}>
            {projects.map((p) => (
              <ProjectCard key={p.id} project={p} />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={{
              display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 4,
              marginTop: 32, paddingTop: 24, borderTop: '1px solid var(--color-border)',
            }}>
              <button
                onClick={() => goPage(page - 1)}
                disabled={page <= 1}
                style={{
                  padding: '6px 10px', borderRadius: 6,
                  border: '1px solid var(--color-border)',
                  background: 'var(--color-surface)',
                  color: page <= 1 ? 'var(--color-text-dim)' : 'var(--color-text)',
                  cursor: page <= 1 ? 'not-allowed' : 'pointer',
                  fontSize: 13, display: 'flex', alignItems: 'center',
                  opacity: page <= 1 ? 0.4 : 1,
                }}
              >
                <ChevronLeft size={16} />
              </button>

              {getPageNumbers().map((p, i) =>
                p === '...' ? (
                  <span key={`dot-${i}`} style={{ padding: '0 4px', color: 'var(--color-text-dim)', fontSize: 13 }}>
                    ...
                  </span>
                ) : (
                  <button
                    key={p}
                    onClick={() => goPage(p)}
                    style={{
                      width: 32, height: 32, borderRadius: 6,
                      border: p === page ? '1px solid var(--color-accent)' : '1px solid transparent',
                      background: p === page ? 'var(--color-accent-bg)' : 'transparent',
                      color: p === page ? 'var(--color-accent)' : 'var(--color-text-muted)',
                      cursor: 'pointer', fontSize: 13, fontWeight: p === page ? 600 : 400,
                      transition: 'all 0.15s',
                    }}
                    onMouseEnter={e => { if (p !== page) { e.currentTarget.style.background = 'var(--color-surface)'; e.currentTarget.style.color = 'var(--color-text)'; }}}
                    onMouseLeave={e => { if (p !== page) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--color-text-muted)'; }}}
                  >
                    {p}
                  </button>
                )
              )}

              <button
                onClick={() => goPage(page + 1)}
                disabled={page >= totalPages}
                style={{
                  padding: '6px 10px', borderRadius: 6,
                  border: '1px solid var(--color-border)',
                  background: 'var(--color-surface)',
                  color: page >= totalPages ? 'var(--color-text-dim)' : 'var(--color-text)',
                  cursor: page >= totalPages ? 'not-allowed' : 'pointer',
                  fontSize: 13, display: 'flex', alignItems: 'center',
                  opacity: page >= totalPages ? 0.4 : 1,
                }}
              >
                <ChevronRight size={16} />
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
      await requestAddProjectPermission(createClient())
      setDone(true)
    } catch (e: any) {
      setErr(e.message || 'Something went wrong')
    } finally {
      setRequesting(false)
    }
  }

  if (done) {
    return (
      <span style={{
        padding: '8px 14px', borderRadius: 8,
        background: 'var(--color-success-bg, #0f2a1a)',
        color: 'var(--color-success, #4ade80)',
        fontSize: 13, fontWeight: 500, whiteSpace: 'nowrap',
      }}>
        ✓ Request sent — admin will review
      </span>
    )
  }

  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
      <button
        onClick={handleRequest}
        disabled={requesting}
        style={{
          padding: '8px 14px', borderRadius: 8,
          background: 'transparent',
          color: 'var(--color-accent)',
          border: '1px solid var(--color-accent)',
          cursor: requesting ? 'default' : 'pointer',
          fontSize: 13, fontWeight: 500,
          display: 'flex', alignItems: 'center', gap: 6,
          opacity: requesting ? 0.6 : 1,
          transition: 'all 0.15s',
        }}
      >
        {requesting ? 'Sending...' : (
          <>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
            Request Permission
          </>
        )}
      </button>
      {err && <span style={{ fontSize: 12, color: 'var(--color-error)' }}>{err}</span>}
    </span>
  )
}

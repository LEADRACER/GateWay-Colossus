'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { searchProjects, getDistinctLanguages } from '@/services/discovery'
import { ProjectCard } from '@/components/features/project/ProjectCard'
import { CategoryNav } from '@/components/ui/CategoryNav'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'
import { EmptyState } from '@/components/ui/EmptyState'
import { ErrorMessage } from '@/components/ui/ErrorMessage'
import type { Project } from '@/lib/types/database'
import { Search, SlidersHorizontal, X } from 'lucide-react'

const statusOptions = ['all', 'active', 'in development', 'archived'] as const

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null)
  const [languageFilter, setLanguageFilter] = useState<string>('')
  const [languages, setLanguages] = useState<string[]>([])
  const [showFilters, setShowFilters] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const supabase = createClient()
      const data = await searchProjects(supabase, search, {
        category: categoryFilter || undefined,
        language: languageFilter || undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
      })
      setProjects(data as Project[])
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [search, categoryFilter, statusFilter, languageFilter])

  useEffect(() => { load() }, [load])

  useEffect(() => {
    const supabase = createClient()
    getDistinctLanguages(supabase).then(setLanguages).catch(() => {})
  }, [])

  const hasFilters = categoryFilter || languageFilter || statusFilter !== 'all'

  function clearFilters() {
    setSearch('')
    setCategoryFilter(null)
    setLanguageFilter('')
    setStatusFilter('all')
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
            {projects.length} project{projects.length !== 1 ? 's' : ''} found
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
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
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
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
            <select value={languageFilter} onChange={e => setLanguageFilter(e.target.value)}
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
          title={hasFilters || search ? 'No matching projects' : 'No projects yet'}
          description={hasFilters || search ? 'Try adjusting your search or filters.' : 'Be the first to showcase your project.'}
        />
      ) : (
        <>
          <p style={{ fontSize: 12, color: 'var(--color-text-dim)', marginBottom: 16 }}>
            Showing {projects.length} project{projects.length !== 1 ? 's' : ''}
          </p>
          <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}>
            {projects.map((p) => (
              <ProjectCard key={p.id} project={p} />
            ))}
          </div>
        </>
      )}
    </div>
  )
}

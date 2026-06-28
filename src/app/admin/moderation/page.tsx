'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { moderateProject } from '@/services/admin'
import type { Project } from '@/lib/types/database'
import { Spinner } from '@/components/ui/Spinner'
import { CheckCircle, XCircle, RefreshCw } from 'lucide-react'

export default function ModerationPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [syncing, setSyncing] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const supabase = createClient()
      const { data } = await supabase
        .from('projects')
        .select('*')
        .eq('status', 'in development')
        .order('created_at', { ascending: false })

      setProjects(data || [])
    } catch {
      // fail silently
    } finally {
      setLoading(false)
    }
  }, [])

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { load() }, [load])

  async function handleModerate(projectId: string, action: 'approve' | 'reject') {
    setActionLoading(projectId)
    try {
      const supabase = createClient()
      await moderateProject(supabase, projectId, action)
      setProjects(prev => prev.filter(p => p.id !== projectId))
    } catch {
      // fail silently
    } finally {
      setActionLoading(null)
    }
  }

  async function handleSync(projectId: string) {
    setSyncing(projectId)
    try {
      const res = await fetch('/api/projects/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ project_id: projectId }),
      })
      const data = await res.json()
      if (data.success) await load()
    } catch {
      // sync failed silently
    } finally {
      setSyncing(null)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-24">
        <Spinner size="lg" />
      </div>
    )
  }

  return (
    <div className="animate-fade-in">
      <div style={{ marginBottom: 20 }}>
        <p style={{ fontSize: 14, color: 'var(--color-text-muted)' }}>
          {projects.length} project{projects.length !== 1 ? 's' : ''} pending review
        </p>
      </div>

      {projects.length === 0 ? (
        <div style={{
          padding: 40, textAlign: 'center',
          background: 'var(--color-surface)',
          borderRadius: 12,
          border: '1px solid var(--color-border)',
        }}>
          <CheckCircle size={32} color="var(--color-accent)" style={{ margin: '0 auto 12' }} />
          <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--color-text)', marginBottom: 4 }}>
            All caught up!
          </h3>
          <p style={{ fontSize: 13, color: 'var(--color-text-dim)' }}>
            No projects pending review. Check back later.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {projects.map((project) => (
            <div key={project.id} style={{
              background: 'var(--color-surface)',
              borderRadius: 12,
              border: '1px solid var(--color-border)',
              padding: 16,
              display: 'flex', alignItems: 'center', gap: 16,
              opacity: actionLoading === project.id ? 0.5 : 1,
              transition: 'opacity 0.2s',
            }}>
              {/* Avatar */}
              {project.repo_avatar ? (
                <Image src={project.repo_avatar} alt={project.owner} width={40} height={40}
                  style={{ borderRadius: '50%', flexShrink: 0, border: '1px solid var(--color-border)' }} />
              ) : (
                <div style={{
                  width: 40, height: 40, borderRadius: '50%',
                  background: 'var(--color-surface-2)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                  border: '1px solid var(--color-border)',
                }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ color: 'var(--color-text-dim)' }}>
                    <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
                  </svg>
                </div>
              )}

              {/* Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Link href={`/projects/${project.id}`} style={{
                    fontSize: 14, fontWeight: 600, color: 'var(--color-text)',
                    textDecoration: 'none',
                  }}>
                    {project.name}
                  </Link>
                  <span style={{
                    padding: '2px 8px', borderRadius: 10,
                    background: 'var(--color-warning-bg)',
                    color: 'var(--color-warning)',
                    fontSize: 11, fontWeight: 500,
                  }}>
                    Pending
                  </span>
                </div>
                <p style={{ fontSize: 12, color: 'var(--color-text-dim)', marginTop: 2 }}>
                  {project.owner}/{project.repo_name}
                </p>
                {project.repo_description && (
                  <p style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 400 }}>
                    {project.repo_description}
                  </p>
                )}
                <div style={{ display: 'flex', gap: 12, marginTop: 6, fontSize: 11, color: 'var(--color-text-dim)' }}>
                  {project.repo_language && <span>{project.repo_language}</span>}
                  {project.repo_stars > 0 && <span>★ {project.repo_stars}</span>}
                  <span>Added {new Date(project.created_at).toLocaleDateString()}</span>
                </div>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                <button
                  onClick={() => handleSync(project.id)}
                  disabled={syncing === project.id}
                  title="Sync GitHub data"
                  style={{
                    padding: '8px 10px', borderRadius: 8,
                    background: 'var(--color-surface-2)',
                    color: 'var(--color-text-muted)',
                    border: '1px solid var(--color-border)',
                    cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: 6,
                    fontSize: 12, fontWeight: 500,
                    opacity: syncing === project.id ? 0.6 : 1,
                    transition: 'opacity 0.2s',
                  }}
                >
                  <RefreshCw size={14} style={{ animation: syncing === project.id ? 'spin 1s linear infinite' : 'none' }} />
                  Sync
                </button>
                <button
                  onClick={() => handleModerate(project.id, 'approve')}
                  disabled={actionLoading === project.id}
                  style={{
                    padding: '8px 14px', borderRadius: 8,
                    background: 'var(--color-accent)',
                    color: '#fff',
                    border: 'none', cursor: 'pointer',
                    fontSize: 12, fontWeight: 500,
                    display: 'flex', alignItems: 'center', gap: 6,
                    opacity: actionLoading === project.id ? 0.6 : 1,
                    transition: 'opacity 0.2s',
                  }}
                >
                  <CheckCircle size={14} />
                  Approve
                </button>
                <button
                  onClick={() => handleModerate(project.id, 'reject')}
                  disabled={actionLoading === project.id}
                  style={{
                    padding: '8px 14px', borderRadius: 8,
                    background: 'var(--color-surface-2)',
                    color: 'var(--color-danger)',
                    border: '1px solid var(--color-border)',
                    cursor: 'pointer',
                    fontSize: 12, fontWeight: 500,
                    display: 'flex', alignItems: 'center', gap: 6,
                    opacity: actionLoading === project.id ? 0.6 : 1,
                    transition: 'opacity 0.2s',
                  }}
                >
                  <XCircle size={14} />
                  Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

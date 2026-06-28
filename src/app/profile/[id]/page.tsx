'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams } from 'next/navigation'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { ProjectCard } from '@/components/features/project/ProjectCard'
import { ErrorMessage } from '@/components/ui/ErrorMessage'
import { EmptyState } from '@/components/ui/EmptyState'
import { Skeleton } from '@/components/ui/Skeleton'
import type { Project, Profile, Activity } from '@/lib/types/database'

const actionLabels: Record<string, string> = {
  project_created: 'created a project',
  project_liked: 'liked a project',
  project_bookmarked: 'bookmarked a project',
  comment_added: 'commented on a project',
  project_submitted: 'submitted a project',
  project_approved: 'project approved',
  project_rejected: 'project rejected',
}

export default function ProfilePage() {
  const params = useParams()
  const id = params.id as string

  const [profile, setProfile] = useState<Profile | null>(null)
  const [projects, setProjects] = useState<Project[]>([])
  const [activities, setActivities] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const supabase = createClient()

      const { data: prof, error: profErr } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', id)
        .single()

      if (profErr || !prof) {
        setError('Profile not found')
        return
      }
      setProfile(prof)

      const { data: projs } = await supabase
        .from('projects')
        .select('*, likes:likes(count), bookmarks:bookmarks(count), comments:comments(count)')
        .eq('created_by', id)
        .order('created_at', { ascending: false })

      setProjects((projs || []).map((p: Project & { likes?: { count: number }[]; bookmarks?: { count: number }[]; comments?: { count: number }[] }) => ({
        ...p,
        like_count: p.likes?.[0]?.count ?? 0,
        bookmark_count: p.bookmarks?.[0]?.count ?? 0,
        comment_count: p.comments?.[0]?.count ?? 0,
      })))

      const { data: acts } = await supabase
        .from('activities')
        .select('*')
        .eq('user_id', id)
        .order('created_at', { ascending: false })
        .limit(15)

      setActivities(acts || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load profile')
    } finally {
      setLoading(false)
    }
  }, [id])

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { load() }, [load])

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-12">
        <Skeleton className="h-8 w-48 mb-2" />
        <Skeleton className="h-4 w-64 mb-8" />
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-border bg-surface p-6">
              <Skeleton className="h-5 w-3/4 mb-4" />
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (error || !profile) {
    return <ErrorMessage message={error || 'Profile not found'} onRetry={load} />
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      {/* Profile header */}
      <div className="mb-10">
        <div className="flex items-center gap-4">
          {profile.avatar_url ? (
            <Image src={profile.avatar_url} alt={profile.username} width={56} height={56}
              className="w-14 h-14 rounded-full ring-2 ring-border" />
          ) : (
            <div className="w-14 h-14 rounded-full bg-surface-alt ring-2 ring-border flex items-center justify-center">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-text-dim">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </div>
          )}
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-text">{profile.username}</h1>
            {profile.bio && (
              <p className="mt-1 text-sm text-text-muted">{profile.bio}</p>
            )}
            <span className="inline-block mt-2 text-xs text-text-dim">
              Role: <span className="text-accent font-medium">{profile.role}</span>
            </span>
          </div>
        </div>
      </div>

      {/* Projects */}
      <h2 className="text-xl font-semibold text-text mb-6">Projects</h2>
      {projects.length === 0 ? (
        <EmptyState title="No projects yet" description="This user hasn't showcased any projects yet." />
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      )}

      {/* Activity Feed */}
      {activities.length > 0 && (
        <div className="mt-10 pt-8 border-t border-border">
          <h2 className="text-xl font-semibold text-text mb-6">Recent Activity</h2>
          <div className="space-y-3">
            {activities.map((act) => (
              <div key={act.id} className="flex items-center gap-3 text-sm">
                <div className="w-8 h-8 rounded-full bg-surface-alt flex items-center justify-center shrink-0">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-text-dim">
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                  </svg>
                </div>
                <span className="text-text-muted">
                  {actionLabels[act.action] || act.action}
                </span>
                <span className="text-text-dim text-xs ml-auto">
                  {new Date(act.created_at).toLocaleDateString(undefined, {
                    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                  })}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

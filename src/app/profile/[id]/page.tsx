'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ProjectCard } from '@/components/features/project/ProjectCard'
import { ErrorMessage } from '@/components/ui/ErrorMessage'
import { EmptyState } from '@/components/ui/EmptyState'
import { Skeleton } from '@/components/ui/Skeleton'
import type { Project, Profile } from '@/lib/types/database'

export default function ProfilePage() {
  const params = useParams()
  const id = params.id as string

  const [profile, setProfile] = useState<Profile | null>(null)
  const [projects, setProjects] = useState<Project[]>([])
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
        .select('*')
        .eq('created_by', id)
        .order('created_at', { ascending: false })

      setProjects(projs || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load profile')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => { load() }, [load])

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-12">
        <Skeleton className="h-8 w-48 mb-2" />
        <Skeleton className="h-4 w-64 mb-8" />
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-lg border border-[#333] bg-[#111] p-6">
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
        <h1 className="text-3xl font-bold text-[#f5f5f5]">{profile.username}</h1>
        {profile.bio && (
          <p className="mt-2 text-[#a3a3a3]">{profile.bio}</p>
        )}
        <span className="inline-block mt-3 text-xs text-[#666]">
          Role: {profile.role}
        </span>
      </div>

      {/* Projects */}
      <h2 className="text-xl font-semibold text-[#f5f5f5] mb-6">Projects</h2>
      {projects.length === 0 ? (
        <EmptyState title="No projects yet" />
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      )}
    </div>
  )
}

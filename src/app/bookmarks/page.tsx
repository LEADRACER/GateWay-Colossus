'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { getUserBookmarkedProjects } from '@/services/social'
import { ProjectCard } from '@/components/features/project/ProjectCard'
import { EmptyState } from '@/components/ui/EmptyState'
import { Spinner } from '@/components/ui/Spinner'
import { Bookmark } from 'lucide-react'

export default function BookmarksPage() {
  const [projects, setProjects] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const supabase = createClient()
      const data = await getUserBookmarkedProjects(supabase)
      setProjects(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load bookmarks')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  return (
    <div className="max-w-6xl mx-auto px-6 py-12">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
          <Bookmark size={20} className="text-accent" />
        </div>
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-text">
            Bookmarks
          </h1>
          <p className="text-sm text-text-muted mt-0.5">
            Projects you've bookmarked for later
          </p>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex justify-center items-center py-24">
          <Spinner size="lg" />
        </div>
      ) : error ? (
        <div className="text-center py-16">
          <p className="text-sm text-error mb-4">{error}</p>
          {error === 'Not authenticated' ? (
            <Link href="/auth/login" className="text-sm text-accent hover:underline">
              Sign in to see your bookmarks
            </Link>
          ) : (
            <button
              onClick={load}
              className="text-sm text-accent hover:underline bg-transparent border-none cursor-pointer"
            >
              Try again
            </button>
          )}
        </div>
      ) : projects.length === 0 ? (
        <EmptyState
          title="No bookmarks yet"
          description="Bookmark projects to save them here for quick access."
          action={
            <Link href="/projects">
              <button className="px-4 py-2 rounded-lg bg-accent text-white text-sm font-medium border-none cursor-pointer">
                Browse Projects
              </button>
            </Link>
          }
        />
      ) : (
        <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}>
          {projects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      )}
    </div>
  )
}

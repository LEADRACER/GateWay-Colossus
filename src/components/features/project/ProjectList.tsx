import type { Project } from '@/lib/types/database'
import { ProjectCard } from './ProjectCard'
import { EmptyState } from '@/components/ui/EmptyState'
import { ErrorMessage } from '@/components/ui/ErrorMessage'
import { Skeleton } from '@/components/ui/Skeleton'
import { Button } from '@/components/ui/Button'

interface ProjectListProps {
  projects: Project[]
  loading: boolean
  error: string | null
  onRetry: () => void
}

export function ProjectList({ projects, loading, error, onRetry }: ProjectListProps) {
  if (loading) {
    return (
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="rounded-lg border border-[#333] bg-[#111] p-6">
            <Skeleton className="h-5 w-3/4 mb-4" />
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        ))}
      </div>
    )
  }

  if (error) {
    return <ErrorMessage message={error} onRetry={onRetry} />
  }

  if (projects.length === 0) {
    return (
      <EmptyState
        title="No projects yet"
        description="Be the first to showcase your project."
        action={<Button>Create Project</Button>}
      />
    )
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {projects.map((project) => (
        <ProjectCard key={project.id} project={project} />
      ))}
    </div>
  )
}

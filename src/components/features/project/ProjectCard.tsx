import Link from 'next/link'
import type { Project } from '@/lib/types/database'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'

interface Props {
  project: Project
}

export function ProjectCard({ project }: Props) {
  const statusColor: Record<string, 'success' | 'warning' | 'default'> = {
    active: 'success',
    'in development': 'warning',
    archived: 'default',
  }

  return (
    <Link href={`/projects/${project.id}`}>
      <Card className="p-5 h-full hover:border-[#444] transition-colors cursor-pointer flex flex-col">
        <div className="flex items-start gap-3 mb-3">
          {project.repo_avatar && (
            <img
              src={project.repo_avatar}
              alt={project.owner}
              className="w-8 h-8 rounded-full shrink-0"
            />
          )}
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-[#f5f5f5] truncate">
              {project.name}
            </h3>
            <p className="text-xs text-[#666] truncate">
              {project.owner}/{project.repo_name}
            </p>
          </div>
        </div>

        {project.repo_description && (
          <p className="text-sm text-[#a3a3a3] line-clamp-2 mb-3 flex-1">
            {project.repo_description}
          </p>
        )}

        <div className="flex items-center gap-3 text-xs text-[#666] mt-auto">
          <span>⭐ {project.repo_stars}</span>
          {project.repo_language && (
            <span className="text-[#00ff41]">{project.repo_language}</span>
          )}
          <Badge variant={statusColor[project.status] || 'default'}>
            {project.status}
          </Badge>
        </div>
      </Card>
    </Link>
  )
}

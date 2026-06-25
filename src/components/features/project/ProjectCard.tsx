'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import type { Project } from '@/lib/types/database'
import { Badge } from '@/components/ui/Badge'
import { TiltCard } from '@/components/ui/TiltCard'
import { ProjectPreview } from '@/components/ui/ProjectPreview'
import { LikeButton, BookmarkButton } from '@/components/ui/SocialButtons'

interface Props {
  project: Project
}

const statusMap: Record<string, { variant: 'success' | 'warning' | 'default' | 'error'; label: string }> = {
  active: { variant: 'success', label: 'Active' },
  'in development': { variant: 'warning', label: 'In Development' },
  archived: { variant: 'default', label: 'Archived' },
  abandoned: { variant: 'error', label: 'Abandoned' },
}

export function ProjectCard({ project }: Props) {
  const status = statusMap[project.status] || { variant: 'default' as const, label: project.status }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 24 }}
    >
      <ProjectPreview project={project}>
      <TiltCard className="h-full">
        <div className="rounded-xl border border-border bg-surface p-5 h-full group
          hover:border-accent/20 hover:bg-surface-alt/50 transition-colors duration-200"
        >
          {/* Header with link */}
          <Link href={`/projects/${project.id}`}>
            <div className="flex items-center gap-3.5 mb-3.5">
              {project.repo_avatar ? (
                <img
                  src={project.repo_avatar}
                  alt={project.owner}
                  className="w-9 h-9 rounded-full shrink-0 ring-1 ring-border"
                />
              ) : (
                <div className="w-9 h-9 rounded-full shrink-0 bg-surface-alt ring-1 ring-border flex items-center justify-center">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-text-dim">
                    <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
                  </svg>
                </div>
              )}
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-sm text-text truncate group-hover:text-accent transition-colors">
                  {project.name}
                </h3>
                <p className="text-xs text-text-dim truncate">
                  {project.owner}/{project.repo_name}
                </p>
              </div>
            </div>
          </Link>

          {project.repo_description && (
            <p className="text-xs text-text-muted line-clamp-2 mb-3.5 leading-relaxed">
              {project.repo_description}
            </p>
          )}

          {/* Meta row */}
          <div className="flex items-center gap-3 text-xs flex-wrap">
            <Badge variant={status.variant} className="px-2 py-0.5 text-[10px]">
              {status.label}
            </Badge>
            {project.repo_stars > 0 && (
              <span className="flex items-center gap-1 text-text-dim">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor" className="text-text-dim/50">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>
                {project.repo_stars}
              </span>
            )}
            {project.repo_language && (
              <span className="text-text-dim/60">{project.repo_language}</span>
            )}
            {project.comment_count !== undefined && project.comment_count > 0 && (
              <span className="text-text-dim/60">{project.comment_count} comment{project.comment_count !== 1 ? 's' : ''}</span>
            )}
          </div>

          {/* Social actions */}
          <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border">
            <LikeButton project={project} size="sm" />
            <BookmarkButton project={project} size="sm" />
          </div>
        </div>
      </TiltCard>
      </ProjectPreview>
    </motion.div>
  )
}

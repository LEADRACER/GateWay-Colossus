'use client'

import Link from 'next/link'
import Image from 'next/image'
import type { Team } from '@/lib/types/database'

interface TeamCardProps {
  team: Team & { project_count?: number }
  variant?: 'card' | 'compact'
}

export function TeamCard({ team, variant = 'card' }: TeamCardProps) {
  const displayName = team.name
  const memberCount = team.member_count || 0

  if (variant === 'compact') {
    return (
      <Link href={`/teams/${team.code}`} className="flex items-center gap-3 p-3 rounded-lg border border-border bg-surface hover:border-accent/20 hover:bg-surface-alt transition-colors group">
        {team.avatar_url ? (
          <Image src={team.avatar_url} alt={team.name} width={40} height={40} className="w-10 h-10 rounded-full ring-1 ring-border shrink-0" />
        ) : (
          <div className="w-10 h-10 rounded-full bg-accent-subtle ring-1 ring-border flex items-center justify-center shrink-0">
            <span className="text-sm font-medium text-accent">{team.name.charAt(0).toUpperCase()}</span>
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm text-text truncate">{displayName}</p>
          <p className="text-xs text-text-dim flex items-center gap-1">
            <span className="w-3 h-3 rounded-full bg-accent/20" />
            {memberCount} member{memberCount !== 1 ? 's' : ''}
          </p>
        </div>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-text-dim group-hover:text-accent transition-colors shrink-0">
          <path d="m9 18 6-6-6-6" />
        </svg>
      </Link>
    )
  }

  return (
    <Link href={`/teams/${team.code}`} className="block">
      <div className="rounded-xl border border-border bg-surface p-5 hover:border-accent/20 hover:bg-surface-alt/50 transition-colors h-full flex flex-col">
        <div className="flex items-start gap-3 mb-4">
          {team.avatar_url ? (
            <Image src={team.avatar_url} alt={team.name} width={48} height={48} className="w-12 h-12 rounded-full ring-1 ring-border shrink-0" />
          ) : (
            <div className="w-12 h-12 rounded-full bg-accent-subtle ring-1 ring-border flex items-center justify-center shrink-0">
              <span className="text-lg font-medium text-accent">{team.name.charAt(0).toUpperCase()}</span>
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-base text-text truncate group-hover:text-accent transition-colors">{displayName}</h3>
            {team.description && (
              <p className="text-xs text-text-dim mt-1 line-clamp-2">{team.description}</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-4 pt-3 border-t border-border">
          <span className="flex items-center gap-1.5 text-xs text-text-dim">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-text-dim/50">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
            </svg>
            {team.member_count} member{team.member_count !== 1 ? 's' : ''}
          </span>
          <span className="flex items-center gap-1.5 text-xs text-text-dim">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-text-dim/50">
              <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
            </svg>
            {team.project_count || 0} project{team.project_count !== 1 ? 's' : ''}
          </span>
          {team.is_locked && (
            <span className="ml-auto inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-medium rounded-full border border-warning/30 bg-warning/10 text-warning">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              Locked
            </span>
          )}
        </div>
      </div>
    </Link>
  )
}
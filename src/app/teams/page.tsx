'use client'

import { Suspense } from 'react'

import Link from 'next/link'
import { TeamList } from '@/components/features/team/TeamList'
import { COPY } from '@/components/shell/copy'
import { Spinner } from '@/components/ui/Spinner'
import { useSupabaseSession as useSession } from '@/hooks/useSupabaseSession'

export default function TeamsPage() {
  const { status } = useSession()

  return (
    <div className="max-w-6xl mx-auto px-6 py-12 md:py-16">
      <p className="font-mono text-xs uppercase tracking-[0.12em] text-gold mb-2">[ the constellation ]</p>
      <h1 className="font-mono text-2xl md:text-3xl font-bold tracking-tight text-text">teams</h1>
      <p className="text-sm text-text-muted mt-1 mb-8 max-w-[64ch]">join a collective, collide on projects, ship together.</p>

      {status === 'authenticated' && (
        <Link
          href="/teams/new"
          className="inline-flex items-center gap-2 h-10 px-4 bg-green text-text-on-accent font-mono text-xs uppercase tracking-[0.08em] hover:bg-green-dim transition-colors mb-10"
        >
          + {COPY.nav.newProject === 'Add Project' ? 'create team' : 'create team'}
        </Link>
      )}

      <Suspense fallback={<div className="flex justify-center py-24"><Spinner size="lg" /></div>}>
        <TeamList searchable />
      </Suspense>
    </div>
  )
}
'use client'

import Link from 'next/link'
import { useTerminalFeed } from '@/hooks/useTerminalFeed'
import { CountUp, FadeIn, Stagger, StaggerRow } from '@/components/motion'
import { COPY } from '@/components/shell/copy'

const STATS = [
  { label: 'collectives', key: 'teams' as const },
  { label: 'projects', key: 'projects' as const },
  { label: 'stars tracked', key: 'stars' as const },
]

export function TeamsIndex() {
  const { feed } = useTerminalFeed()

  return (
    <section className="border-t border-border">
      <div className="max-w-6xl mx-auto px-6 py-20">
        <FadeIn>
          <div className="flex items-end justify-between mb-10">
            <div>
              <h2 className="stamp font-mono text-sm text-gold uppercase tracking-[0.08em]">
                {COPY.home.sections.teams}
              </h2>
              <p className="mt-3 text-sm text-text-dim">live aggregate from the constellation</p>
            </div>
            <Link href="/teams" className="font-mono text-xs text-text-muted hover:text-green-bright">
              open constellation →
            </Link>
          </div>
        </FadeIn>
        <Stagger className="grid gap-5 sm:grid-cols-3">
          {STATS.map(({ label, key }) => (
            <StaggerRow key={key} className="p-5 bg-bg-raised border border-border">
              <div className="font-mono text-3xl text-green-bright tabular-nums">
                <CountUp
                  value={
                    feed
                      ? key === 'teams'
                        ? feed.metadata.totalTeams
                        : key === 'projects'
                          ? feed.metadata.totalProjects
                          : feed.metadata.totalStars
                      : 0
                  }
                />
              </div>
              <div className="mt-2 font-mono text-xs uppercase tracking-[0.1em] text-text-dim">
                {label}
              </div>
            </StaggerRow>
          ))}
        </Stagger>
      </div>
    </section>
  )
}

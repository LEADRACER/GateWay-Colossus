'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { FadeIn, Stagger, StaggerRow } from '@/components/motion'
import { COPY } from '@/components/shell/copy'
import { Flame, Star, ArrowRight, Network } from 'lucide-react'
import type { Project } from '@/lib/types/database'

type FeaturedProject = Project & { featured_note?: string }

export default function HomePage() {
  const [featured, setFeatured] = useState<FeaturedProject[]>([])
  const [trending, setTrending] = useState<Project[]>([])

  useEffect(() => {
    let cancelled = false
    Promise.all([
      import('@/lib/supabase/client').then(m => m.createClient),
      import('@/services/discovery').then(m => ({
        getFeaturedProjects: m.getFeaturedProjects,
        getTrendingProjects: m.getTrendingProjects,
      })),
    ]).then(([createClient, { getFeaturedProjects, getTrendingProjects }]) => {
      if (cancelled) return
      const supabase = createClient()
      Promise.all([
        getFeaturedProjects(supabase),
        getTrendingProjects(supabase, 5),
      ])
        .then(([f, t]) => {
          if (!cancelled) {
            setFeatured(f)
            setTrending(t)
          }
        })
        .catch(() => {})
    })
    return () => { cancelled = true }
  }, [])

  return (
    <div className="relative">
      {/* Hero — text sits directly on the terminal */}
      <section className="min-h-[80vh] flex items-center">
        <div className="max-w-6xl mx-auto w-full px-6 py-20">
          <p className="font-mono text-xs uppercase tracking-[0.12em] text-gold mb-6">
            [ {COPY.home.heroTag} ]
          </p>
          <FadeIn variant="up">
            <h1 className="font-mono font-bold tracking-tight leading-none text-text text-5xl sm:text-6xl md:text-7xl">
              {COPY.brand.line1}
              <span className="text-gold">:</span>
              <span className="text-green-bright">{COPY.brand.line2}</span>
            </h1>
          </FadeIn>
          <FadeIn variant="up" style={{ transitionDelay: '80ms' }}>
            <p className="mt-8 text-lg text-text-muted leading-relaxed max-w-[52ch]">
              {COPY.home.manifesto}
            </p>
          </FadeIn>
          <FadeIn variant="up" style={{ transitionDelay: '160ms' }}>
            <div className="mt-10 flex flex-wrap gap-4">
              <Link
                href="/projects"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-green text-text-on-accent font-mono text-sm hover:bg-green-dim transition-colors"
              >
                [ {COPY.home.ctaPrimary} ] <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/teams"
                className="inline-flex items-center gap-2 px-5 py-2.5 border border-border text-text-muted font-mono text-sm hover:text-text hover:border-border-light transition-colors"
              >
                <Network className="w-4 h-4" /> {COPY.home.ctaSecondary}
              </Link>
              <Link
                href="/projects/new"
                className="inline-flex items-center gap-2 px-5 py-2.5 font-mono text-sm text-text-dim hover:text-text transition-colors"
              >
                showcase your work →
              </Link>
            </div>
          </FadeIn>
          <FadeIn variant="fade" style={{ transitionDelay: '240ms' }}>
            <p className="mt-6 font-mono text-xs text-text-dim">
              scene override:{' '}
              {['boot', 'rain', 'constellation', 'ticker'].map((s, i) => (
                <span key={s}>
                  {i > 0 && <span className="text-text-dim/40"> · </span>}
                  <Link
                    href={`/?scene=${s}`}
                    className="text-text-muted hover:text-green-bright"
                    onClick={(e) => {
                      e.preventDefault()
                      const params = new URLSearchParams(window.location.search)
                      params.set('scene', s)
                      window.location.search = params.toString()
                    }}
                  >
                    {s}
                  </Link>
                </span>
              ))}
            </p>
          </FadeIn>
        </div>
      </section>

      {/* FIRED — showcase */}
      <section id="fired" className="border-t border-border">
        <div className="max-w-6xl mx-auto px-6 py-20">
          <FadeIn>
            <div className="flex items-end justify-between mb-10">
              <div>
                <h2 className="stamp font-mono text-sm text-gold uppercase tracking-[0.08em]">
                  {COPY.home.sections.showcase}
                </h2>
                <p className="mt-3 text-sm text-text-dim">hand-picked by the community</p>
              </div>
              <Flame size={18} className="text-error/70" />
            </div>
          </FadeIn>

          {featured.length > 0 ? (
            <Stagger className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {featured.slice(0, 9).map((project, index) => (
                <StaggerRow key={project.id} className="h-full">
                  <Link
                    href={`/projects/${project.id}`}
                    className="group block h-full p-5 bg-bg-raised border border-border hover:border-border-light transition-colors"
                  >
                    <div className={`h-full flex flex-col ${index < 3 ? 'border-l-2 border-gold pl-4' : ''}`}>
                      <div className="flex items-start gap-3 mb-4">
                        {project.repo_avatar ? (
                          <Image
                            src={project.repo_avatar}
                            alt={project.owner}
                            width={36}
                            height={36}
                            className="w-9 h-9 rounded-none border border-border shrink-0"
                          />
                        ) : (
                          <div className="w-9 h-9 border border-border bg-surface-alt flex items-center justify-center shrink-0 font-mono text-xs text-text-dim">
                            {(project.owner ?? '?').slice(0, 2).toUpperCase()}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <h3 className="font-mono text-sm text-text truncate group-hover:text-green-bright transition-colors">
                            {project.name}
                          </h3>
                          <p className="font-mono text-xs text-text-dim truncate">
                            {project.owner}/{project.repo_name}
                          </p>
                        </div>
                      </div>
                      {project.repo_description && (
                        <p className="text-sm text-text-muted line-clamp-2 mb-4 flex-1">
                          {project.repo_description}
                        </p>
                      )}
                      <div className="flex flex-wrap items-center gap-3 font-mono text-xs text-text-dim">
                        {project.repo_stars > 0 && (
                          <span className="flex items-center gap-1.5 text-gold">
                            <Star size={12} className="fill-current" />
                            {project.repo_stars.toLocaleString()}
                          </span>
                        )}
                        {project.repo_language && (
                          <span className="px-2 py-0.5 border border-border text-text-muted">
                            {project.repo_language.toLowerCase()}
                          </span>
                        )}
                      </div>
                      {project.featured_note && (
                        <p className="mt-4 pt-3 border-t border-border font-mono text-xs text-green-bright">
                          ★ {project.featured_note}
                        </p>
                      )}
                    </div>
                  </Link>
                </StaggerRow>
              ))}
            </Stagger>
          ) : (
            <div className="corner-ticks rule-dashed max-w-md mx-auto px-6 py-10 font-mono text-sm text-text-dim text-center">
              ─ no showcased projects yet ─
            </div>
          )}
        </div>
      </section>

      {/* Trending */}
      <section className="border-t border-border">
        <div className="max-w-6xl mx-auto px-6 py-20">
          <FadeIn>
            <div className="flex items-end justify-between mb-10">
              <div>
                <h2 className="stamp font-mono text-sm text-gold uppercase tracking-[0.08em]">
                  {COPY.home.sections.trending}
                </h2>
                <p className="mt-3 text-sm text-text-dim">most starred this week</p>
              </div>
              <Link href="/trending" className="font-mono text-xs text-text-muted hover:text-green-bright">
                view all →
              </Link>
            </div>
          </FadeIn>

          {trending.length > 0 ? (
            <Stagger className="divide-y divide-border border-y border-border">
              {trending.slice(0, 8).map((project, index) => (
                <StaggerRow key={project.id}>
                  <Link
                    href={`/projects/${project.id}`}
                    className="group flex items-center gap-4 px-3 py-3.5 hover:bg-surface-hover transition-colors"
                  >
                    <span className={`font-mono text-sm w-8 tabular-nums ${index === 0 ? 'text-gold' : 'text-text-dim'}`}>
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    {project.repo_avatar ? (
                      <Image
                        src={project.repo_avatar}
                        alt={project.owner}
                        width={32}
                        height={32}
                        className="w-8 h-8 rounded-none border border-border shrink-0"
                      />
                    ) : (
                      <div className="w-8 h-8 border border-border bg-surface-alt shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <span className="font-mono text-sm text-text block truncate group-hover:text-green-bright transition-colors">
                        {project.name}
                      </span>
                      <span className="font-mono text-xs text-text-dim">{project.owner}</span>
                    </div>
                    <div className="flex items-center gap-4 shrink-0 font-mono text-xs">
                      {project.repo_language && (
                        <span className="hidden sm:inline px-2 py-0.5 border border-border text-text-muted">
                          {project.repo_language.toLowerCase()}
                        </span>
                      )}
                      {project.repo_stars > 0 && (
                        <span className="flex items-center gap-1.5 text-gold tabular-nums">
                          <Star size={12} className="fill-current" />
                          {project.repo_stars.toLocaleString()}
                        </span>
                      )}
                    </div>
                  </Link>
                </StaggerRow>
              ))}
            </Stagger>
          ) : (
            <div className="corner-ticks rule-dashed max-w-md mx-auto px-6 py-10 font-mono text-sm text-text-dim text-center">
              ─ nothing trending yet ─
            </div>
          )}
        </div>
      </section>

      {/* Build together — teams strip */}
      <section className="border-t border-border">
        <div className="max-w-6xl mx-auto px-6 py-20 text-center">
          <FadeIn>
            <p className="font-mono text-xs uppercase tracking-[0.12em] text-text-dim mb-4">
              {COPY.home.sections.teams}
            </p>
            <p className="text-xl text-text max-w-2xl mx-auto">
              join teams, collide on projects, and ship with developers who share the shelf.
            </p>
            <Link
              href="/teams"
              className="inline-flex items-center gap-2 mt-8 px-5 py-2.5 bg-green text-text-on-accent font-mono text-sm hover:bg-green-dim transition-colors"
            >
              [ discover teams ] <ArrowRight className="w-4 h-4" />
            </Link>
          </FadeIn>
        </div>
      </section>
    </div>
  )
}

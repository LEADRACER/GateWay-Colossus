'use client'

import Link from 'next/link'
import { ArrowRight, Network } from 'lucide-react'
import { FadeIn } from '@/components/motion'
import { COPY } from '@/components/shell/copy'
import { requestScene } from '@/components/features/terminal/sceneBus'
import type { SceneName } from '@/components/features/terminal/sceneBus'

const SCENES: SceneName[] = ['boot', 'rain', 'constellation', 'ticker']

export function HeroTerminal() {
  return (
    <div className="max-w-6xl mx-auto w-full px-6 py-20">
      <p className="font-mono text-xs uppercase tracking-[0.12em] text-gold mb-6">
        [ {COPY.home.heroTag} ]
      </p>
      <FadeIn variant="up">
        <h1 className="font-mono font-bold tracking-tight leading-none text-text text-5xl sm:text-6xl md:text-7xl">
          {COPY.brand.line1.replace(/:$/, '')}
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
          scene:{' '}
          {SCENES.map((s, i) => (
            <span key={s}>
              {i > 0 && <span className="text-text-dim/40"> · </span>}
              <button
                className="text-text-muted hover:text-green-bright transition-colors"
                onClick={() => requestScene(s)}
              >
                {s}
              </button>
            </span>
          ))}
        </p>
      </FadeIn>
    </div>
  )
}

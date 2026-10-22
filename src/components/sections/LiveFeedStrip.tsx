'use client'

import { useEffect, useState, useSyncExternalStore } from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import {
  getEventsSnapshot,
  subscribeEventsStore,
} from '@/components/features/terminal/events'
import type { TerminalEvent } from '@/components/features/terminal/events'
import { COPY } from '@/components/shell/copy'

const MAX_VISIBLE = 6
const EMPTY: TerminalEvent[] = []

function subscribe(fn: () => void): () => void {
  return subscribeEventsStore(fn)
}

export function LiveFeedStrip() {
  const events = useSyncExternalStore(subscribe, getEventsSnapshot, () => EMPTY)
  const [now, setNow] = useState<number | null>(null)
  const reduced = useReducedMotion()

  useEffect(() => {
    if (reduced) return
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [reduced])

  const latest = [...events].slice(-MAX_VISIBLE).reverse()

  return (
    <section className="border-t border-border">
      <div className="max-w-6xl mx-auto px-6 py-12">
        <h2 className="font-mono text-xs uppercase tracking-[0.12em] text-gold mb-6">
          [ {COPY.home.sections.feed} ]
        </h2>
        <ul className="divide-y divide-border/60 border-y border-border/60 font-mono text-xs">
          {latest.length === 0 ? (
            <li className="py-4 text-text-dim">no signals yet — trigger something</li>
          ) : (
            <AnimatePresence initial={false}>
              {latest.map((e) => {
                const age = now === null ? 0 : Math.max(1, Math.round((now - e.at) / 1000))
                const ageText = age < 60 ? `${age}s` : age < 3600 ? `${Math.round(age / 60)}m` : `${Math.round(age / 3600)}h`
                return (
                  <motion.li
                    key={e.id}
                    initial={reduced ? false : { opacity: 0, y: '-0.5rem' }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35, ease: 'easeOut', layout: { duration: 0.2 } }}
                    layout={reduced ? false : true}
                    className="py-3 flex items-baseline gap-3 text-text-muted"
                  >
                    <span className="text-green-bright shrink-0">›</span>
                    <span className="min-w-0 flex-1 truncate">{e.text}</span>
                    <span className="text-text-dim tabular-nums shrink-0">{now === null ? '' : `${ageText} ago`}</span>
                  </motion.li>
                )
              })}
            </AnimatePresence>
          )}
        </ul>
      </div>
    </section>
  )
}

'use client'

import { useEffect, useState, useSyncExternalStore } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import {
  CYCLE_SCENES,
  requestScene,
  subscribeActiveScene,
  type SceneName,
} from './sceneBus'
import { subscribeEventsStore, getEventsCount } from './events'
import { popIn } from '@/components/motion/variants'

function formatClock(ts: number): string {
  const d = new Date(ts)
  return `${String(d.getUTCHours()).padStart(2, '0')}:${String(d.getUTCMinutes()).padStart(2, '0')}:${String(d.getUTCSeconds()).padStart(2, '0')}Z`
}

export function Statusbar() {
  const [scene, setScene] = useState<string>('boot')
  const eventCount = useSyncExternalStore(subscribeEventsStore, getEventsCount, () => 0)
  const [pulse, setPulse] = useState(0)
  const [clock, setClock] = useState<string | null>(null)
  const reduced = useReducedMotion()

  useEffect(() => {
    const unsubScene = subscribeActiveScene(setScene)
    const unsubEvents = subscribeEventsStore(() => setPulse((p) => p + 1))
    let clearClock: (() => void) | null = null
    if (!reduced) {
      const id = setInterval(() => setClock(formatClock(Date.now())), 1000)
      clearClock = () => clearInterval(id)
    }
    return () => {
      unsubScene()
      unsubEvents()
      clearClock?.()
    }
  }, [reduced])

  const cycle = () => {
    const idx = CYCLE_SCENES.indexOf((scene as SceneName) ?? 'rain')
    const next = CYCLE_SCENES[(idx + 1 + CYCLE_SCENES.length) % CYCLE_SCENES.length] ?? 'rain'
    requestScene(next)
  }

  return (
    <div className="fixed bottom-0 inset-x-0 z-40 h-6 border-t border-border bg-bg/95 font-mono text-[11px] text-text-dim flex items-center select-none">
      <button
        onClick={cycle}
        className="px-3 h-full flex items-center gap-2 hover:text-text transition-colors cursor-pointer border-r border-border text-text-muted"
        title="cycle scene"
      >
        <span className="text-green-bright">▌</span> {scene}
      </button>
      <motion.span
        key={pulse}
        variants={popIn}
        initial={pulse === 0 ? false : 'hidden'}
        animate="show"
        className="px-3 border-r border-border flex items-center gap-1"
        title="tracked events this session"
      >
        evt <span className="text-green-bright tabular-nums">{String(eventCount).padStart(2, '0')}</span>
      </motion.span>
      <span className="px-3 border-r border-border hidden sm:flex items-center tabular-nums">{clock ?? '--:--:--'}</span>
      <span className="ml-auto pr-3 hidden sm:block">gw:colossus v2</span>
    </div>
  )
}

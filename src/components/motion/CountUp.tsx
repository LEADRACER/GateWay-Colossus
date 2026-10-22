'use client'

import { useEffect, useRef, useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { numberTick } from './variants'

export function CountUp({
  value,
  duration = 0.5,
  format,
  gold = false,
  className,
}: {
  value: number
  duration?: number
  format?: (n: number) => string
  gold?: boolean
  className?: string
}) {
  const reduced = useReducedMotion()
  const [animated, setAnimated] = useState(0)
  const fromRef = useRef(0)

  const display = reduced ? value : animated

  useEffect(() => {
    if (reduced) return
    const from = fromRef.current
    const start = performance.now()
    let raf = 0
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / (duration * 1000))
      const eased = 1 - Math.pow(1 - t, 3)
      setAnimated(Math.round(from + (value - from) * eased))
      if (t < 1) raf = requestAnimationFrame(tick)
      else fromRef.current = value
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [value, duration, reduced])

  return (
    <motion.span
      className={className}
      style={{ fontVariantNumeric: 'tabular-nums' }}
      initial={reduced ? false : { color: gold ? 'var(--color-gold)' : 'var(--color-green-bright)' }}
      animate={{ color: 'inherit' }}
      transition={numberTick}
    >
      {format ? format(display) : display.toLocaleString()}
    </motion.span>
  )
}

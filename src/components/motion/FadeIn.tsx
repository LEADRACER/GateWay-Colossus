'use client'

import { motion, useReducedMotion, type HTMLMotionProps } from 'framer-motion'
import { fade, fadeUp, stagger, rowIn } from './variants'

interface MotionProps extends HTMLMotionProps<'div'> {
  children?: React.ReactNode
}

export function FadeIn({ variant = 'up', children, ...rest }: MotionProps & { variant?: 'up' | 'fade' }) {
  const reduced = useReducedMotion()
  if (reduced) return <div {...(rest as object)}>{children}</div>
  return (
    <motion.div
      variants={variant === 'up' ? fadeUp : fade}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: '-80px' }}
      {...rest}
    >
      {children}
    </motion.div>
  )
}

export function Stagger({ children, gap = 0.05, className, ...rest }: MotionProps & { gap?: number }) {
  const reduced = useReducedMotion()
  if (reduced) return <div className={className}>{children}</div>
  return (
    <motion.div
      variants={stagger(gap)}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: '-60px' }}
      className={className}
      {...rest}
    >
      {children}
    </motion.div>
  )
}

export function StaggerRow({ children, className, ...rest }: MotionProps) {
  const reduced = useReducedMotion()
  if (reduced) return <div className={className}>{children}</div>
  return (
    <motion.div variants={rowIn} className={className} {...rest}>
      {children}
    </motion.div>
  )
}

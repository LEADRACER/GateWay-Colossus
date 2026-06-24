'use client'

import { motion } from 'framer-motion'
import type { ReactNode } from 'react'

const pageVariants = {
  initial: {
    opacity: 0,
    y: 8,
    filter: 'blur(4px)',
  },
  enter: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: {
      type: 'spring' as const,
      stiffness: 260,
      damping: 24,
      staggerChildren: 0.04,
      delayChildren: 0.08,
    },
  },
  exit: {
    opacity: 0,
    y: -4,
    filter: 'blur(2px)',
    transition: {
      type: 'spring' as const,
      stiffness: 300,
      damping: 28,
    },
  },
}

const childVariants = {
  initial: { opacity: 0, y: 8 },
  enter: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -4 },
}

interface PageTransitionProps {
  children: ReactNode
  className?: string
}

export function PageTransition({ children, className = '' }: PageTransitionProps) {
  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="enter"
      exit="exit"
      className={className}
    >
      {children}
    </motion.div>
  )
}

export function FadeInSection({
  children,
  className = '',
  delay = 0,
}: {
  children: ReactNode
  className?: string
  delay?: number
}) {
  return (
    <motion.div
      variants={childVariants}
      initial="initial"
      whileInView="enter"
      viewport={{ once: true, margin: '-40px' }}
      transition={{ delay, type: 'spring' as const, stiffness: 260, damping: 24 }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

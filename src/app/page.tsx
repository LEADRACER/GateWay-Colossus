'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { RippleButton } from '@/components/ui/RippleButton'
import { StatsSection } from '@/components/features/StatsSection'

const stagger = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.07 },
  },
} as const

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 260, damping: 20 } },
} as const

export default function HomePage() {
  return (
    <div className="min-h-[90vh] flex flex-col">
      {/* Hero — asymmetric split */}
      <section className="flex-1 flex items-center">
        <div className="max-w-6xl mx-auto w-full px-6 py-16 md:py-24">
          <div className="grid md:grid-cols-2 gap-12 md:gap-16 items-center">
            {/* Left — text */}
            <motion.div
              initial="hidden"
              animate="show"
              variants={stagger}
              className="order-2 md:order-1"
            >
              <motion.div variants={fadeUp} className="inline-flex items-center gap-2 rounded-full border border-accent/15 bg-accent-subtle px-3 py-1 text-xs text-accent font-medium mb-6">
                <span className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse" />
                Community Project Showcase
              </motion.div>

              <motion.h1 variants={fadeUp} className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tighter leading-none text-text">
                GateWay:<span className="text-accent">Colossus</span>
              </motion.h1>

              <motion.p variants={fadeUp} className="mt-5 text-base sm:text-lg text-text-muted leading-relaxed max-w-[45ch]">
                A living archive of community-built projects. Share your work, discover what others are building, and draw inspiration from the collective.
              </motion.p>

              <motion.div variants={fadeUp} className="mt-8 flex flex-wrap gap-3">
                <Link href="/projects">
                  <RippleButton size="lg">
                    Browse Projects
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ml-1">
                      <path d="M5 12h14" />
                      <path d="m12 5 7 7-7 7" />
                    </svg>
                  </RippleButton>
                </Link>
                <Link href="/auth/register">
                  <RippleButton variant="secondary" size="lg">
                    Showcase Your Work
                  </RippleButton>
                </Link>
              </motion.div>
            </motion.div>

            {/* Right — decorative orb */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: 'spring', stiffness: 200, damping: 20, delay: 0.2 }}
              className="order-1 md:order-2 flex justify-center md:justify-end"
            >
              <div className="relative w-64 h-64 sm:w-72 sm:h-72 md:w-80 md:h-80">
                <div className="absolute inset-0 rounded-full border border-accent/5" />
                <div className="absolute inset-[15%] rounded-full border border-accent/10" />
                <div className="absolute inset-[30%] rounded-full border border-accent/15" />
                <motion.div
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                  className="absolute inset-[45%] rounded-full bg-accent-glow blur-xl"
                />
                <div className="absolute inset-[45%] rounded-full border border-accent/30" />
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
                  className="absolute inset-[5%] rounded-full border border-dashed border-accent/8"
                />
                <div className="absolute inset-[47%] rounded-full bg-accent blur-sm" />
              </div>
            </motion.div>
          </div>

          {/* Stats bar */}
          <StatsSection />
        </div>
      </section>
    </div>
  )
}

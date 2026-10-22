'use client'

import { useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { overlayPanel, overlayScrim, spring } from '@/components/motion/variants'

interface ModalProps {
  open: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
}

export function Modal({ open, onClose, title, children }: ModalProps) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    },
    [onClose],
  )

  useEffect(() => {
    if (open) {
      document.addEventListener('keydown', handleKeyDown)
      return () => document.removeEventListener('keydown', handleKeyDown)
    }
  }, [open, handleKeyDown])

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            variants={overlayScrim}
            initial="hidden"
            animate="show"
            exit="hidden"
            transition={{ duration: 0.18 }}
            className="absolute inset-0 bg-black/70 backdrop-blur-[2px]"
            onClick={onClose}
          />

          {/* Panel */}
          <motion.div
            variants={overlayPanel}
            initial="hidden"
            animate="show"
            exit="hidden"
            transition={spring}
            className="relative z-10 w-full max-w-lg rounded-none border border-border bg-bg-raised shadow-2xl"
          >
            <div className="flex items-center justify-between px-6 pt-6 pb-0">
              <h2 className="font-mono text-xs uppercase tracking-[0.12em] text-gold">{title}</h2>
              <button
                onClick={onClose}
                className="h-7 w-7 rounded-none flex items-center justify-center text-text-dim hover:text-text hover:bg-surface-alt transition-colors font-mono"
                aria-label="close"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <div className="p-6">
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

'use client'

import { useState, useRef, type ReactNode } from 'react'
import { motion, useMotionValue, useSpring } from 'framer-motion'

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'
type ButtonSize = 'sm' | 'md' | 'lg'

interface RippleButtonProps {
  variant?: ButtonVariant
  size?: ButtonSize
  loading?: boolean
  disabled?: boolean
  children: ReactNode
  className?: string
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void
  type?: 'button' | 'submit' | 'reset'
}

interface Ripple {
  id: number
  x: number
  y: number
  size: number
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    'bg-accent text-[#050505] font-medium hover:brightness-110 active:brightness-90 shadow-[0_0_12px_-6px_oklch(0.75_0.25_145/0.5)]',
  secondary:
    'border border-border bg-surface-alt text-text hover:bg-surface hover:border-text-dim/30',
  ghost:
    'text-text-muted hover:text-text hover:bg-surface-alt',
  danger:
    'border border-error/30 bg-error/5 text-error hover:bg-error/10 hover:border-error/50',
}

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'h-8 px-3 text-xs gap-1.5 rounded-lg',
  md: 'h-9 px-4 text-sm gap-2 rounded-lg',
  lg: 'h-10 px-5 text-sm gap-2.5 rounded-lg',
}

export function RippleButton({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  children,
  className = '',
  onClick,
  type = 'button',
}: RippleButtonProps) {
  const [ripples, setRipples] = useState<Ripple[]>([])
  const buttonRef = useRef<HTMLButtonElement>(null)
  const nextId = useRef(0)
  const scale = useMotionValue(1)
  const springScale = useSpring(scale, { stiffness: 400, damping: 17 })

  function handleClick(e: React.MouseEvent<HTMLButtonElement>) {
    if (disabled || loading) return

    const btn = buttonRef.current
    if (btn) {
      const rect = btn.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top
      const size = Math.max(rect.width, rect.height) * 2
      const id = nextId.current++

      setRipples((prev) => [...prev, { id, x, y, size }])
      setTimeout(() => {
        setRipples((prev) => prev.filter((r) => r.id !== id))
      }, 600)
    }

    onClick?.(e)
  }

  return (
    <button
      ref={buttonRef}
      className={`relative overflow-hidden inline-flex items-center justify-center whitespace-nowrap
        transition-all duration-150 ease-spring
        disabled:opacity-40 disabled:pointer-events-none
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${className}
        btn-pressable`}
      disabled={disabled || loading}
      onClick={handleClick}
      type={type}
      style={{ '--btn-scale': springScale } as React.CSSProperties}
      onPointerDown={() => scale.set(0.97)}
      onPointerUp={() => scale.set(1)}
      onPointerLeave={() => scale.set(1)}
    >
      {loading && (
        <svg
          className="animate-spin shrink-0"
          width={size === 'sm' ? '12' : '14'}
          height={size === 'sm' ? '12' : '14'}
          viewBox="0 0 24 24"
          fill="none"
        >
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity="0.25" />
          <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
        </svg>
      )}
      {children}

      {/* Ripple effects */}
      {ripples.map((ripple) => (
        <motion.span
          key={ripple.id}
          initial={{ scale: 0, opacity: 0.4 }}
          animate={{ scale: 1, opacity: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="absolute rounded-full bg-current pointer-events-none"
          style={{
            left: ripple.x - ripple.size / 2,
            top: ripple.y - ripple.size / 2,
            width: ripple.size,
            height: ripple.size,
          }}
        />
      ))}
    </button>
  )
}

'use client'

import { forwardRef, useState, useEffect, useRef, type ReactNode, type HTMLAttributes } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface HolographicCardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'primary' | 'secondary' | 'accent' | 'danger'
  intensity?: number
  interactive?: boolean
  children: ReactNode
  onClick?: () => void
}

const variantColors = {
  primary: { border: '00d4ff', glow: '00d4ff', bg: '001a2e' },
  secondary: { border: '8b5cf6', glow: 'a855f7', bg: '1a0a2e' },
  accent: { border: 'ff006e', glow: 'ff006e', bg: '2e001a' },
  danger: { border: 'ef4444', glow: 'f87171', bg: '2e0a0a' },
}

export const HolographicCard = forwardRef<HTMLDivElement, HolographicCardProps>(
  function HolographicCard({
    variant = 'primary',
    intensity = 1,
    interactive = true,
    children,
    onClick,
    className = '',
    style,
    ...props
  }, ref) {
    const [isHovered, setIsHovered] = useState(false)
    const [mousePos, setMousePos] = useState({ x: 0.5, y: 0.5 })
    const colors = variantColors[variant]
    const containerRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
      const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!containerRef.current) return
        const rect = containerRef.current.getBoundingClientRect()
        setMousePos({
          x: (e.clientX - rect.left) / rect.width,
          y: (e.clientY - rect.top) / rect.height,
        })
      }
      const handleMouseLeave = () => setIsHovered(false)
      const handleMouseEnter = () => setIsHovered(true)

      const el = containerRef.current
      if (el) {
        el.addEventListener('mousemove', handleMouseMove as any)
        el.addEventListener('mouseleave', handleMouseLeave)
        el.addEventListener('mouseenter', handleMouseEnter)
      }
      return () => {
        if (el) {
          el.removeEventListener('mousemove', handleMouseMove as any)
          el.removeEventListener('mouseleave', handleMouseLeave)
          el.removeEventListener('mouseenter', handleMouseEnter)
        }
      }
    }, [])

    const gradientX = (mousePos.x - 0.5) * 2
    const gradientY = (mousePos.y - 0.5) * 2

    return (
      <motion.div
        ref={containerRef}
        className={`relative overflow-hidden rounded-2xl ${className}`}
        style={{
          ...style,
          background: `linear-gradient(135deg, 
            rgba(${parseInt(colors.bg.slice(0,2),16)},${parseInt(colors.bg.slice(2,4),16)},${parseInt(colors.bg.slice(4,6),16)},0.1) 0%,
            rgba(${parseInt(colors.bg.slice(0,2),16)},${parseInt(colors.bg.slice(2,4),16)},${parseInt(colors.bg.slice(4,6),16)},0.03) 50%,
            rgba(${parseInt(colors.bg.slice(0,2),16)},${parseInt(colors.bg.slice(2,4),16)},${parseInt(colors.bg.slice(4,6),16)},0.1) 100%)`,
          border: `1px solid rgba(${parseInt(colors.border.slice(0,2),16)},${parseInt(colors.border.slice(2,4),16)},${parseInt(colors.border.slice(4,6),16)},${0.3 + intensity * 0.3})`,
          boxShadow: `
            0 0 ${20 * intensity}px rgba(${parseInt(colors.glow.slice(0,2),16)},${parseInt(colors.glow.slice(2,4),16)},${parseInt(colors.glow.slice(4,6),16)},${0.1 * intensity}),
            inset 0 1px 0 rgba(255,255,255,0.05),
            ${isHovered ? `0 0 ${40 * intensity}px rgba(${parseInt(colors.glow.slice(0,2),16)},${parseInt(colors.glow.slice(2,4),16)},${parseInt(colors.glow.slice(4,6),16)},${0.2 * intensity})` : ''}
          `,
          backdropFilter: 'blur(20px) saturate(180%)',
          WebkitBackdropFilter: 'blur(20px) saturate(180%)',
          cursor: interactive ? 'pointer' : 'default',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
        whileHover={{ scale: interactive ? 1.02 : 1, y: -4 }}
        whileTap={{ scale: interactive ? 0.98 : 1 }}
        onClick={onClick}
      >
        <AnimatePresence mode="popLayout">
          {isHovered && interactive && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="absolute inset-0 pointer-events-none"
              style={{
                background: `radial-gradient(ellipse at ${mousePos.x * 100}% ${mousePos.y * 100}%, 
                  rgba(${parseInt(colors.glow.slice(0,2),16)},${parseInt(colors.glow.slice(2,4),16)},${parseInt(colors.glow.slice(4,6),16)},${0.15 * intensity}) 0%, 
                  transparent 70%)`,
              }}
            />
          )}
        </AnimatePresence>

        <div className="absolute inset-0 pointer-events-none overflow-hidden" style={{ borderRadius: 'inherit' }}>
          <div 
            className="absolute -top-1/2 -left-1/2 w-full h-full"
            style={{
              width: '200%',
              height: '200%',
              background: `conic-gradient(from 0deg, 
                transparent 0deg,
                rgba(${parseInt(colors.glow.slice(0,2),16)},${parseInt(colors.glow.slice(2,4),16)},${parseInt(colors.glow.slice(4,6),16)},${0.08 * intensity}) 90deg,
                transparent 180deg,
                rgba(${parseInt(colors.glow.slice(0,2),16)},${parseInt(colors.glow.slice(2,4),16)},${parseInt(colors.glow.slice(4,6),16)},${0.08 * intensity}) 270deg,
                transparent 360deg)`,
              animation: 'rotate 8s linear infinite',
              opacity: isHovered ? 1 : 0.3,
            }}
          />
          <style jsx global>{`
            @keyframes rotate {
              from { transform: rotate(0deg); }
              to { transform: rotate(360deg); }
            }
          `}</style>
        </div>

        <div className="absolute inset-0 pointer-events-none" style={{
          background: `linear-gradient(180deg, 
            rgba(255,255,255,${0.05 * intensity}) 0%, 
            transparent 50%, 
            rgba(0,0,0,${0.1 * intensity}) 100%)`,
        }} />

        <div className="relative z-10 p-6 md:p-8">
          {children}
        </div>

        <div className="absolute inset-0 pointer-events-none" style={{
          borderRadius: 'inherit',
          boxShadow: `inset 0 1px 0 rgba(255,255,255,${0.1 * intensity})`,
        }} />
      </motion.div>
    )
  }
)

HolographicCard.displayName = 'HolographicCard'

interface HolographicButtonProps {
  variant?: 'primary' | 'secondary' | 'accent' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  children: ReactNode
  onClick?: () => void
  disabled?: boolean
  loading?: boolean
  className?: string
  fullWidth?: boolean
}

const buttonVariants = {
  primary: { bg: '00d4ff', text: '050505', glow: '00d4ff', border: '37374f' },
  secondary: { bg: '1e1e2e', text: 'ffffff', glow: '8b5cf6', border: '37374f' },
  accent: { bg: 'ff006e', text: 'ffffff', glow: 'ff006e', border: '37374f' },
  ghost: { bg: 'transparent', text: 'ffffff', glow: '00d4ff', border: '37374f' },
}

const buttonSizes = {
  sm: 'px-4 py-2 text-xs gap-1.5',
  md: 'px-6 py-3 text-sm gap-2',
  lg: 'px-8 py-4 text-base gap-2.5',
}

export const HolographicButton = forwardRef<HTMLButtonElement, HolographicButtonProps>(
  function HolographicButton({
    variant = 'primary',
    size = 'md',
    children,
    onClick,
    disabled = false,
    loading = false,
    className = '',
    fullWidth = false,
    ...props
  }, ref) {
    const [isHovered, setIsHovered] = useState(false)
    const [mousePos, setMousePos] = useState({ x: 0.5, y: 0.5 })
    const colors = buttonVariants[variant]

    return (
      <motion.button
        ref={ref}
        className={`relative inline-flex items-center justify-center whitespace-nowrap font-medium rounded-xl overflow-hidden ${buttonSizes[size]} ${fullWidth ? 'w-full' : ''} ${className}`}
        style={{
          background: variant === 'ghost' 
            ? `rgba(${parseInt(colors.bg?.slice(0,2)||'0',16)},${parseInt(colors.bg?.slice(2,4)||'0',16)},${parseInt(colors.bg?.slice(4,6)||'0',16)},0.1)`
            : `linear-gradient(135deg, 
                rgb(${parseInt(colors.bg.slice(0,2),16)},${parseInt(colors.bg.slice(2,4),16)},${parseInt(colors.bg.slice(4,6),16)}) 0%,
                rgb(${Math.max(0, parseInt(colors.bg.slice(0,2),16)-30)},${Math.max(0, parseInt(colors.bg.slice(2,4),16)-30)},${Math.max(0, parseInt(colors.bg.slice(4,6),16)-30)}) 100%)`,
          color: `rgb(${parseInt(colors.text.slice(0,2),16)},${parseInt(colors.text.slice(2,4),16)},${parseInt(colors.text.slice(4,6),16)})`,
          border: variant === 'ghost' 
            ? `1px solid rgba(${parseInt((colors.border||'37374f').slice(0,2),16)},${parseInt((colors.border||'37374f').slice(2,4),16)},${parseInt((colors.border||'37374f').slice(4,6),16)},0.5)`
            : 'none',
          boxShadow: `
            0 0 ${isHovered ? 30 : 15}px rgba(${parseInt(colors.glow.slice(0,2),16)},${parseInt(colors.glow.slice(2,4),16)},${parseInt(colors.glow.slice(4,6),16)},${isHovered ? 0.4 : 0.2}),
            0 4px 20px rgba(0,0,0,0.3),
            inset 0 1px 0 rgba(255,255,255,0.1)
          `,
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          cursor: disabled || loading ? 'not-allowed' : 'pointer',
          opacity: disabled || loading ? 0.5 : 1,
          transition: 'all 0.2s ease',
        }}
        whileHover={{ scale: !disabled && !loading ? 1.03 : 1, y: -2 }}
        whileTap={{ scale: !disabled && !loading ? 0.97 : 1 }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onMouseMove={(e) => {
          const rect = e.currentTarget.getBoundingClientRect()
          setMousePos({
            x: (e.clientX - rect.left) / rect.width,
            y: (e.clientY - rect.top) / rect.height,
          })
        }}
        onClick={onClick}
        disabled={disabled || loading}
      >
        <AnimatePresence mode="popLayout">
          {isHovered && !disabled && !loading && (
            <motion.div
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.5 }}
              className="absolute inset-0 pointer-events-none"
              style={{
                background: `radial-gradient(circle at ${mousePos.x * 100}% ${mousePos.y * 100}%, 
                  rgba(255,255,255,0.2) 0%, 
                  transparent 70%)`,
                borderRadius: 'inherit',
              }}
            />
          )}
        </AnimatePresence>

        <div className="absolute inset-0 pointer-events-none" style={{
          background: `linear-gradient(180deg, 
            rgba(255,255,255,0.15) 0%, 
            transparent 50%, 
            rgba(0,0,0,0.1) 100%)`,
        }} />

        {loading && (
          <svg
            className="animate-spin shrink-0"
            width={size === 'sm' ? 14 : size === 'md' ? 16 : 18}
            height={size === 'sm' ? 14 : size === 'md' ? 16 : 18}
            viewBox="0 0 24 24"
            fill="none"
            style={{ color: `rgb(${parseInt(colors.text.slice(0,2),16)},${parseInt(colors.text.slice(2,4),16)},${parseInt(colors.text.slice(4,6),16)})` }}
          >
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity="0.25" />
            <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
          </svg>
        )}

        <span className="relative z-10 flex items-center gap-2">
          {children}
        </span>

        <div className="absolute inset-0 pointer-events-none" style={{
          borderRadius: 'inherit',
          boxShadow: `inset 0 1px 0 rgba(255,255,255,0.2)`,
        }} />
      </motion.button>
    )
  }
)

HolographicButton.displayName = 'HolographicButton'

interface HolographicInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  variant?: 'primary' | 'secondary'
}

export const HolographicInput = forwardRef<HTMLInputElement, HolographicInputProps>(
  function HolographicInput({ label, error, variant = 'primary', className = '', ...props }, ref) {
    const [isFocused, setIsFocused] = useState(false)
    const colors = variant === 'primary' ? variantColors.primary : variantColors.secondary

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label className="text-xs font-medium text-text-muted tracking-wide uppercase">
            {label}
          </label>
        )}
        <div className="relative">
          <input
            ref={ref}
            className={`w-full rounded-xl bg-surface/50 border px-4 py-3 text-sm text-text placeholder:text-text-dim/50 transition-all duration-200
              ${error 
                ? 'border-error/50 focus:border-error focus:ring-error/20' 
                : 'border-border focus:border-accent/50'}
              ${isFocused ? 'bg-surface/80' : ''}`}
            style={{
              borderColor: error 
                ? 'rgba(239,68,68,0.5)' 
                : isFocused 
                  ? `rgba(${parseInt(colors.border.slice(0,2),16)},${parseInt(colors.border.slice(2,4),16)},${parseInt(colors.border.slice(4,6),16)},0.8)`
                  : 'rgba(55,55,79,0.5)',
              boxShadow: isFocused && !error 
                ? `0 0 20px rgba(${parseInt(colors.glow.slice(0,2),16)},${parseInt(colors.glow.slice(2,4),16)},${parseInt(colors.glow.slice(4,6),16)},0.2), inset 0 0 0 1px rgba(${parseInt(colors.glow.slice(0,2),16)},${parseInt(colors.glow.slice(2,4),16)},${parseInt(colors.glow.slice(4,6),16)},0.3)`
                : 'none',
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)',
            }}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            {...props}
          />
          {error && (
            <motion.span
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute -bottom-5 left-0 text-xs text-error font-medium"
            >
              {error}
            </motion.span>
          )}
        </div>
      </div>
    )
  }
)

HolographicInput.displayName = 'HolographicInput'

interface GlowingTextProps {
  children: ReactNode
  className?: string
  variant?: 'primary' | 'accent' | 'gold'
  animated?: boolean
}

export function GlowingText({ children, className = '', variant = 'primary', animated = true }: GlowingTextProps) {
  const colors = {
    primary: '00d4ff',
    accent: 'ff006e',
    gold: 'ffd700',
  }
  const color = colors[variant]

  return (
    <span
      className={`relative ${className}`}
      style={{
        background: `linear-gradient(135deg, 
          rgb(${parseInt(color.slice(0,2),16)},${parseInt(color.slice(2,4),16)},${parseInt(color.slice(4,6),16)}) 0%,
          rgb(${Math.min(255, parseInt(color.slice(0,2),16)+50)},${Math.min(255, parseInt(color.slice(2,4),16)+50)},${Math.min(255, parseInt(color.slice(4,6),16)+50)}) 100%)`,
        WebkitBackgroundClip: 'text',
        backgroundClip: 'text',
        color: 'transparent',
        filter: animated ? `drop-shadow(0 0 ${variant === 'gold' ? 10 : 20}px rgba(${parseInt(color.slice(0,2),16)},${parseInt(color.slice(2,4),16)},${parseInt(color.slice(4,6),16)},0.6))` : 'none',
        animation: animated ? 'pulse-glow 3s ease-in-out infinite' : 'none',
      }}
    >
      {children}
      <style jsx global>{`
        @keyframes pulse-glow {
          0%, 100% { filter: drop-shadow(0 0 10px rgba(${parseInt(color.slice(0,2),16)},${parseInt(color.slice(2,4),16)},${parseInt(color.slice(4,6),16)},0.6)); }
          50% { filter: drop-shadow(0 0 30px rgba(${parseInt(color.slice(0,2),16)},${parseInt(color.slice(2,4),16)},${parseInt(color.slice(4,6),16)},0.9)); }
        }
      `}</style>
    </span>
  )
}

interface ScanlineOverlayProps {
  intensity?: number
  speed?: number
  className?: string
}

export function ScanlineOverlay({ intensity = 0.1, speed = 2, className = '' }: ScanlineOverlayProps) {
  return (
    <div
      className={`pointer-events-none fixed inset-0 z-50 ${className}`}
      style={{
        backgroundImage: `repeating-linear-gradient(
          0deg,
          transparent,
          transparent 2px,
          rgba(0,0,0,${intensity}) 2px,
          rgba(0,0,0,${intensity}) 4px
        )`,
        animation: `scanlines ${speed}s linear infinite`,
        opacity: 0.5,
      }}
    >
      <style jsx global>{`
        @keyframes scanlines {
          0% { background-position: 0 0; }
          100% { background-position: 0 4px; }
        }
      `}</style>
    </div>
  )
}

interface GridBackgroundProps {
  className?: string
  color?: string
  opacity?: number
  animated?: boolean
}

export function GridBackground({ className = '', color = '00d4ff', opacity = 0.05, animated = true }: GridBackgroundProps) {
  return (
    <div
      className={`absolute inset-0 pointer-events-none ${className}`}
      style={{
        backgroundImage: `
          linear-gradient(rgba(${parseInt(color.slice(0,2),16)},${parseInt(color.slice(2,4),16)},${parseInt(color.slice(4,6),16)},${opacity}) 1px, transparent 1px),
          linear-gradient(90deg, rgba(${parseInt(color.slice(0,2),16)},${parseInt(color.slice(2,4),16)},${parseInt(color.slice(4,6),16)},${opacity}) 1px, transparent 1px)
        `,
        backgroundSize: '60px 60px',
        animation: animated ? 'grid-move 20s linear infinite' : 'none',
        opacity: 0.5,
      }}
    >
      <style jsx global>{`
        @keyframes grid-move {
          0% { background-position: 0 0; }
          100% { background-position: 60px 60px; }
        }
      `}</style>
    </div>
  )
}
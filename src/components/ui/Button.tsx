'use client'

import type { ButtonHTMLAttributes, ReactNode } from 'react'

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'
type ButtonSize = 'sm' | 'md' | 'lg'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  loading?: boolean
  children: ReactNode
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    'bg-green text-text-on-accent font-mono uppercase tracking-[0.08em] hover:bg-green-dim active:brightness-95',
  secondary:
    'border border-border bg-bg-raised text-text font-mono uppercase tracking-[0.08em] hover:border-border-light hover:bg-surface-hover',
  ghost:
    'text-text-muted font-mono hover:text-text hover:bg-surface-alt',
  danger:
    'border border-error/40 bg-transparent text-error font-mono uppercase tracking-[0.08em] hover:bg-error/10 hover:border-error/60',
}

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'h-8 px-3 text-[11px] gap-1.5',
  md: 'h-10 px-4 text-xs gap-2',
  lg: 'h-12 px-6 text-sm gap-2.5',
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled,
  children,
  className = '',
  ...props
}: ButtonProps) {
  return (
    <button
      className={`inline-flex items-center justify-center whitespace-nowrap rounded-none
        transition-colors duration-150
        disabled:opacity-40 disabled:pointer-events-none
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${className}`}
      disabled={disabled || loading}
      {...props}
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
    </button>
  )
}

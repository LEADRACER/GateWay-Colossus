type BadgeVariant = 'default' | 'success' | 'warning' | 'error' | 'info'

interface BadgeProps {
  children: React.ReactNode
  variant?: BadgeVariant
  className?: string
}

const variantMap: Record<BadgeVariant, string> = {
  default: 'bg-surface-alt text-text-muted border-border',
  success: 'bg-green/10 text-green-bright border-green/30',
  warning: 'bg-gold/10 text-gold border-gold/30',
  error: 'bg-error/10 text-error border-error/25',
  info: 'bg-info/10 text-info border-info/30',
}

export function Badge({ children, variant = 'default', className = '' }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-none border px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.08em] leading-none ${variantMap[variant]} ${className}`}
    >
      {children}
    </span>
  )
}

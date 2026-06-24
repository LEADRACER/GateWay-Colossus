type BadgeVariant = 'default' | 'success' | 'warning' | 'error' | 'info'

interface BadgeProps {
  children: React.ReactNode
  variant?: BadgeVariant
}

const variantMap: Record<BadgeVariant, string> = {
  default: 'bg-[#1a1a1a] text-[#a3a3a3] border-[#333]',
  success: 'bg-[#00ff41]/10 text-[#00ff41] border-[#00ff41]/30',
  warning: 'bg-[#ffaa00]/10 text-[#ffaa00] border-[#ffaa00]/30',
  error: 'bg-[#ff3355]/10 text-[#ff3355] border-[#ff3355]/30',
  info: 'bg-[#3399ff]/10 text-[#3399ff] border-[#3399ff]/30',
}

export function Badge({ children, variant = 'default' }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${variantMap[variant]}`}
    >
      {children}
    </span>
  )
}

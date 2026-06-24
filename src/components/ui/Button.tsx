type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: 'sm' | 'md' | 'lg'
}

const variantStyles: Record<ButtonVariant, string> = {
  primary: 'bg-[#00ff41] text-[#0a0a0a] hover:bg-[#00cc33]',
  secondary: 'bg-[#1a1a1a] text-[#f5f5f5] border border-[#333] hover:bg-[#222]',
  ghost: 'bg-transparent text-[#a3a3a3] hover:text-[#f5f5f5] hover:bg-[#111]',
  danger: 'bg-[#ff3355] text-white hover:bg-[#cc2244]',
}

const sizeStyles = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-4 py-2 text-sm',
  lg: 'px-6 py-3 text-base',
}

export function Button({
  variant = 'primary',
  size = 'md',
  className = '',
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      className={`inline-flex items-center justify-center rounded font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-[#00ff41]/50 disabled:opacity-50 disabled:pointer-events-none ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
      disabled={disabled}
      {...props}
    />
  )
}

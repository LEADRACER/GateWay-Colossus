interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const sizeMap = {
  sm: 'h-4 w-4 border-[2px]',
  md: 'h-5 w-5 border-[2px]',
  lg: 'h-7 w-7 border-[2.5px]',
}

export function Spinner({ size = 'md', className = '' }: SpinnerProps) {
  return (
    <div
      className={`rounded-full border-border border-t-accent animate-spin ${sizeMap[size]} ${className}`}
    />
  )
}

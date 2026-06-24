interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg'
}

const sizeMap = {
  sm: 'h-4 w-4 border-2',
  md: 'h-6 w-6 border-2',
  lg: 'h-8 w-8 border-3',
}

export function Spinner({ size = 'md' }: SpinnerProps) {
  return (
    <div
      className={`animate-spin rounded-full border-[#333] border-t-[#00ff41] ${sizeMap[size]}`}
    />
  )
}

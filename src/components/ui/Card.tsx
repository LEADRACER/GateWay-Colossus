interface CardProps {
  children: React.ReactNode
  className?: string
  hover?: boolean
}

export function Card({ children, className = '', hover = false }: CardProps) {
  return (
    <div
      className={`rounded-xl border border-border bg-surface p-6 ${
        hover
          ? 'transition-all duration-300 hover:border-border-light hover:bg-surface-hover hover:-translate-y-0.5'
          : ''
      } ${className}`}
    >
      {children}
    </div>
  )
}

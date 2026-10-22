interface CardProps {
  children: React.ReactNode
  className?: string
  hover?: boolean
}

export function Card({ children, className = '', hover = false }: CardProps) {
  return (
    <div
      className={`rounded-none border border-border bg-bg-raised p-6 ${
        hover
          ? 'transition-colors duration-200 hover:border-border-light hover:bg-surface-hover'
          : ''
      } ${className}`}
    >
      {children}
    </div>
  )
}

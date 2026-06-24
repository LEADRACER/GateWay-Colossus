interface CardProps {
  children: React.ReactNode
  className?: string
}

export function Card({ children, className = '' }: CardProps) {
  return (
    <div
      className={`rounded-lg border border-[#333] bg-[#111] p-6 ${className}`}
    >
      {children}
    </div>
  )
}

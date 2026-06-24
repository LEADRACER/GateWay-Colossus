interface EmptyStateProps {
  title: string
  description?: string
  action?: React.ReactNode
}

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <p className="text-lg font-medium text-[#a3a3a3]">{title}</p>
      {description && (
        <p className="mt-2 text-sm text-[#666] max-w-md">{description}</p>
      )}
      {action && (
        <div className="mt-6">{action}</div>
      )}
    </div>
  )
}

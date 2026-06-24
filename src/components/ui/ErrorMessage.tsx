'use client'

interface ErrorMessageProps {
  message: string
  onRetry?: () => void
}

export function ErrorMessage({ message, onRetry }: ErrorMessageProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center px-6">
      <div className="mb-5 h-12 w-12 rounded-full border border-error/20 bg-error/5 flex items-center justify-center">
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          className="text-error"
        >
          <circle cx="12" cy="12" r="10" />
          <line x1="15" y1="9" x2="9" y2="15" />
          <line x1="9" y1="9" x2="15" y2="15" />
        </svg>
      </div>
      <h3 className="text-sm font-medium text-error">Something went wrong</h3>
      <p className="mt-1.5 text-sm text-text-muted max-w-sm">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-5 text-sm text-accent hover:text-accent-dim transition-colors underline underline-offset-4 decoration-accent/30"
        >
          Try again
        </button>
      )}
    </div>
  )
}

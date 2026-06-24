'use client'

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-6 text-center">
      <div className="inline-flex items-center justify-center w-14 h-14 rounded-full border border-error/20 bg-error/5 mb-5">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-error">
          <circle cx="12" cy="12" r="10" />
          <line x1="15" y1="9" x2="9" y2="15" />
          <line x1="9" y1="9" x2="15" y2="15" />
        </svg>
      </div>
      <h1 className="text-base font-semibold text-text">Something went wrong</h1>
      <p className="mt-1.5 text-sm text-text-muted max-w-sm">{error.message}</p>
      <button
        onClick={reset}
        className="mt-6 text-sm text-accent hover:text-accent-dim transition-colors underline underline-offset-4 decoration-accent/30"
      >
        Try again
      </button>
    </div>
  )
}

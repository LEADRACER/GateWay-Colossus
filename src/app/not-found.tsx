import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-6 text-center">
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full border border-border bg-surface-alt mb-6">
        <span className="text-2xl font-bold text-text-dim tracking-tighter">404</span>
      </div>
      <h1 className="text-lg font-semibold text-text">Page not found</h1>
      <p className="mt-1.5 text-sm text-text-muted max-w-sm">
        The page you&apos;re looking for doesn&apos;t exist or has been moved.
      </p>
      <Link
        href="/"
        className="mt-6 inline-flex items-center gap-1.5 text-sm text-accent hover:text-accent-dim transition-colors underline underline-offset-4 decoration-accent/30"
      >
        Go home
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 12h14" />
          <path d="m12 5 7 7-7 7" />
        </svg>
      </Link>
    </div>
  )
}

'use client'

import { Button } from '@/components/ui/Button'
import { COPY } from '@/components/shell/copy'

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-6 text-center">
      <p className="font-mono text-xs uppercase tracking-[0.12em] text-gold mb-4">[ kernel panic ]</p>
      <h1 className="font-mono text-2xl font-bold text-text">fatal: something went wrong</h1>
      <p className="mt-3 font-mono text-xs text-error max-w-[60ch] break-words">
        $ {error.message || 'unhandled exception'}
      </p>
      <p className="mt-4 font-mono text-[11px] text-text-dim">
        {COPY.brand.line1.replace(/:$/, '')}:{COPY.brand.line2} has logged the trace. nothing is lost.
      </p>
      <Button variant="secondary" className="mt-8" onClick={() => reset()}>
        re-boot session
      </Button>
    </div>
  )
}

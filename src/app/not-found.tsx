import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { COPY } from '@/components/shell/copy'

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-6 text-center">
      <p className="font-mono text-xs uppercase tracking-[0.12em] text-gold mb-4">[ dead tty ]</p>
      <h1 className="font-mono text-5xl font-bold text-text tracking-tight">404</h1>
      <p className="mt-4 font-mono text-sm text-text-muted max-w-[56ch]">
        no record at this address. the archive has no memory of it.
      </p>
      <Link href="/" className="mt-8">
        <Button variant="secondary">← back to the gateway</Button>
      </Link>
    </div>
  )
}

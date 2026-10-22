import Link from 'next/link'
import { COPY } from './copy'

export function Footer() {
  return (
    <footer className="border-t border-border bg-bg font-mono text-xs text-text-dim">
      <div className="max-w-6xl mx-auto px-6 py-10 flex flex-col sm:flex-row items-center justify-between gap-4">
        <p>
          {COPY.brand.line1}
          <span className="text-gold">:</span>
          <span className="text-green-bright">{COPY.brand.line2}</span>
        </p>
        <div className="flex items-center gap-5">
          <Link href="/dev-tty" className="hover:text-text-muted">terminal</Link>
          <Link href="/dev/ui" className="hover:text-text-muted">{COPY.nav.devShelf}</Link>
          <span>built by akhil</span>
        </div>
      </div>
    </footer>
  )
}

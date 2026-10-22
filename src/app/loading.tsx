import { Spinner } from '@/components/ui/Spinner'

export default function GlobalLoading() {
  return (
    <div className="flex justify-center items-center min-h-[60vh] font-mono text-xs text-text-dim">
      <span className="flex items-center gap-3">
        <Spinner size="lg" /> establishing session…
      </span>
    </div>
  )
}

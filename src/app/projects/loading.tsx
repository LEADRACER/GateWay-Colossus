import { Skeleton } from '@/components/ui/Skeleton'
import { COPY } from '@/components/shell/copy'

export default function ProjectsLoading() {
  return (
    <div className="max-w-6xl mx-auto px-6 py-12">
      <div className="mb-8">
        <Skeleton className="h-3 w-36 mb-3" />
        <Skeleton className="h-8 w-56 mb-2" />
        <Skeleton className="h-4 w-72" />
        <span className="sr-only">{COPY.brand.line1.replace(/:$/, '')} loading…</span>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-52" />
        ))}
      </div>
    </div>
  )
}

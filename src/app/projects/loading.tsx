import { Skeleton } from '@/components/ui/Skeleton'

export default function ProjectsLoading() {
  return (
    <div className="max-w-6xl mx-auto px-6 py-12">
      <Skeleton className="h-8 w-48 mb-8" />
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="rounded-lg border border-[#333] bg-[#111] p-6">
            <Skeleton className="h-5 w-3/4 mb-4" />
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        ))}
      </div>
    </div>
  )
}

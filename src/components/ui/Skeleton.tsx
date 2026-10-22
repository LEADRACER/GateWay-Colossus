'use client'

interface SkeletonProps {
  className?: string
}

export function Skeleton({ className = '' }: SkeletonProps) {
  return (
    <div
      className={`rounded-none bg-surface-alt relative overflow-hidden ${className}`}
    >
      <div
        className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite]"
        style={{
          background:
            'linear-gradient(90deg, transparent, rgba(108,196,122,0.06), transparent)',
        }}
      />
    </div>
  )
}

export function SkeletonText({ lines = 3, className = '' }: { lines?: number; className?: string }) {
  return (
    <div className={`space-y-2.5 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className={`h-3.5 ${i === lines - 1 ? 'w-3/5' : i === 0 ? 'w-full' : 'w-4/5'}`}
        />
      ))}
    </div>
  )
}

export function SkeletonCard() {
  return (
    <div className="rounded-none border border-border bg-bg-raised p-5 space-y-4">
      <div className="flex items-center gap-3.5">
        <Skeleton className="h-9 w-9 rounded-none shrink-0" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      </div>
      <SkeletonText lines={2} />
      <div className="flex gap-3">
        <Skeleton className="h-3 w-12" />
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-3 w-14" />
      </div>
    </div>
  )
}

export function SkeletonProjectDetail() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-12 md:py-16 space-y-6">
      <div className="flex items-center gap-4">
        <Skeleton className="h-11 w-11 rounded-none" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-6 w-1/3" />
          <Skeleton className="h-4 w-1/4" />
        </div>
      </div>
      <Skeleton className="h-48 w-full" />
      <SkeletonText lines={4} />
      <div className="flex gap-3">
        <Skeleton className="h-9 w-28 rounded-none" />
        <Skeleton className="h-9 w-28 rounded-none" />
        <Skeleton className="h-9 w-24 rounded-none" />
      </div>
    </div>
  )
}

export function SkeletonGrid({ count = 6 }: { count?: number }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  )
}

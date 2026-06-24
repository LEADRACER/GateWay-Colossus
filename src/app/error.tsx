'use client'

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] px-6 text-center">
      <h1 className="text-2xl font-bold text-[#ff3355]">Something went wrong</h1>
      <p className="mt-2 text-sm text-[#a3a3a3]">{error.message}</p>
      <button
        onClick={reset}
        className="mt-6 text-sm text-[#3399ff] hover:underline"
      >
        Try again
      </button>
    </div>
  )
}

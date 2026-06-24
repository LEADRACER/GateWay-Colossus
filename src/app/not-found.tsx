import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] px-6 text-center">
      <h1 className="text-6xl font-bold text-[#333]">404</h1>
      <p className="mt-4 text-lg text-[#a3a3a3]">This page doesn&apos;t exist.</p>
      <Link
        href="/"
        className="mt-6 text-sm text-[#3399ff] hover:underline"
      >
        Go home →
      </Link>
    </div>
  )
}

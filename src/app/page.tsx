import Link from 'next/link'
import { Button } from '@/components/ui/Button'

export default function HomePage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-6 text-center">
      <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-[#f5f5f5]">
        GateWay:<span className="text-[#00ff41]">Colossus</span>
      </h1>
      <p className="mt-4 text-lg text-[#a3a3a3] max-w-lg">
        A community project showcase. Built by Akhil, powered by the collective.
      </p>
      <div className="mt-8 flex gap-4">
        <Link href="/projects">
          <Button size="lg">Browse Projects</Button>
        </Link>
        <Link href="/auth/register">
          <Button variant="secondary" size="lg">Join</Button>
        </Link>
      </div>
    </div>
  )
}

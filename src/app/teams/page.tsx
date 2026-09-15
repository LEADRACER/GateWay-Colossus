'use client'

import { Suspense } from 'react'
import { Plus, Users } from 'lucide-react'
import Link from 'next/link'
import { TeamList } from '@/components/features/team/TeamList'
import { Spinner } from '@/components/ui/Spinner'
import { useSession } from 'next-auth/react'

export default function TeamsPage() {
  const { data: session, status } = useSession()

  return (
    <div className="max-w-6xl mx-auto px-6 py-12 md:py-16">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-10">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center">
              <Users size={24} className="text-accent" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-text">
                Teams
              </h1>
              <p className="text-sm text-text-muted mt-1">
                Discover and join communities building together
              </p>
            </div>
          </div>

          {status === 'authenticated' && (
            <Link href="/teams/new">
              <button className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-accent text-white font-medium text-sm hover:opacity-90 transition-opacity whitespace-nowrap">
                <Plus size={18} />
                Create Team
              </button>
            </Link>
          )}
        </div>

      <Suspense fallback={<div className="flex justify-center py-24"><Spinner size="lg" /></div>}>
        <TeamList searchable />
      </Suspense>
    </div>
  </div>
  )
}
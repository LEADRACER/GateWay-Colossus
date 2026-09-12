'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { NewProjectForm } from '@/components/features/project/NewProjectForm'
import { Spinner } from '@/components/ui/Spinner'

export default function NewProjectPage() {
  const router = useRouter()
  const { data: session, status } = useSession()

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <Spinner size="lg" />
      </div>
    )
  }

  if (!session?.user) {
    useEffect(() => {
      router.replace('/auth/signin?callbackUrl=/projects/new')
    }, [router])
    return null
  }

  return (
    <div className="max-w-xl mx-auto px-6 py-12 md:py-16">
      <h1 className="text-xl md:text-2xl font-bold tracking-tight text-text mb-8">
        New Project
      </h1>
      <NewProjectForm />
    </div>
  )
}
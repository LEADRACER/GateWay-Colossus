'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { NewProjectForm } from '@/components/features/project/NewProjectForm'
import { Spinner } from '@/components/ui/Spinner'

export default function NewProjectPage() {
  const router = useRouter()
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    async function check() {
      const { data: { user } } = await createClient().auth.getUser()
      if (!user) {
        router.replace('/auth/login')
      } else {
        setChecking(false)
      }
    }
    check()
  }, [router])

  if (checking) {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <Spinner size="lg" />
      </div>
    )
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

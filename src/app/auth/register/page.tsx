'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card } from '@/components/ui/Card'
import { RegisterForm } from '@/components/features/auth/RegisterForm'
import { Spinner } from '@/components/ui/Spinner'

export default function RegisterPage() {
  const router = useRouter()
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    async function check() {
      const { data: { user } } = await createClient().auth.getUser()
      if (user) {
        router.replace('/projects')
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
    <div className="flex items-center justify-center min-h-[70vh] px-6">
      <Card className="w-full max-w-sm">
        <h1 className="text-xl font-bold text-[#f5f5f5] mb-6">Create Account</h1>
        <RegisterForm />
        <p className="mt-6 text-center text-sm text-[#666]">
          Already have an account?{' '}
          <a href="/auth/login" className="text-[#3399ff] hover:underline">
            Sign In
          </a>
        </p>
      </Card>
    </div>
  )
}

'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Spinner } from '@/components/ui/Spinner'

export default function LoginPage() {
  const router = useRouter()

  useEffect(() => {
    router.replace('/auth/totp-login')
  }, [router])

  return (
    <div className="flex items-center justify-center min-h-[70vh]">
      <Spinner size="lg" />
    </div>
  )
}
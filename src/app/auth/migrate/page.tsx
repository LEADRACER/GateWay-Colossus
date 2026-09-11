'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Spinner } from '@/components/ui/Spinner'

export default function MigrationLoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(true)
  const [signingIn, setSigningIn] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  useEffect(() => {
    async function checkSession() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        router.replace('/auth/totp-setup')
      } else {
        setLoading(false)
      }
    }
    checkSession()
  }, [router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSigningIn(true)
    setError(null)

    try {
      const supabase = createClient()
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw error
      router.replace('/auth/totp-setup')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed')
      setSigningIn(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <Spinner size="lg" />
      </div>
    )
  }

  return (
    <div className="flex items-center justify-center min-h-[80vh] px-6">
      <Card className="w-full max-w-sm p-6">
        <h1 className="text-lg font-semibold text-text mb-2">Migrate to TOTP</h1>
        <p className="text-sm text-text-dim mb-6">Sign in with your existing account to set up authenticator app</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
          />
          <Input
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
          />

          {error && (
            <p className="text-sm text-error text-center">{error}</p>
          )}

          <Button type="submit" className="w-full" loading={signingIn}>
            Sign In & Setup TOTP
          </Button>
        </form>

        <p className="mt-4 text-center text-xs text-text-dim">
          This is a one-time migration. After setup, you'll use 6-digit codes only.
        </p>
      </Card>
    </div>
  )
}
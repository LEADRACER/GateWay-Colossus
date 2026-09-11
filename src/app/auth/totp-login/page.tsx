'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Spinner } from '@/components/ui/Spinner'

export default function TOTPLoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(true)
  const [verifying, setVerifying] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [token, setToken] = useState('')
  const [mode, setMode] = useState<'user' | 'shared'>('user')
  const [userEmail, setUserEmail] = useState('')
  const [showShared, setShowShared] = useState(false)

  useEffect(() => {
    async function checkSession() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        router.replace('/projects')
      } else {
        setLoading(false)
      }
    }
    checkSession()
  }, [router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!token || token.length !== 6) return
    
    setVerifying(true)
    setError(null)

    try {
      const response = await fetch('/api/auth/totp-verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, email: userEmail, mode }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Verification failed')
        setVerifying(false)
        return
      }

      router.replace(searchParams.get('next') || '/projects')
    } catch {
      setError('Verification failed')
      setVerifying(false)
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
        <h1 className="text-lg font-semibold text-text mb-1">Sign In with TOTP</h1>
        <p className="text-sm text-text-dim mb-6">Enter the 6-digit code from your authenticator app</p>

        <div className="mb-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="mode"
              checked={mode === 'user'}
              onChange={() => setMode('user')}
              className="text-accent"
            />
            <span className="text-sm text-text">Personal TOTP</span>
          </label>
          {showShared && (
            <label className="flex items-center gap-2 cursor-pointer ml-4">
              <input
                type="radio"
                name="mode"
                checked={mode === 'shared'}
                onChange={() => setMode('shared')}
                className="text-accent"
              />
              <span className="text-sm text-text">Team TOTP</span>
            </label>
          )}
        </div>

        {mode === 'user' && (
          <Input
            label="Email"
            type="email"
            value={userEmail}
            onChange={(e) => setUserEmail(e.target.value)}
            placeholder="you@example.com"
            required
            className="mb-4"
          />
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="6-Digit Code"
            type="text"
            value={token}
            onChange={(e) => setToken(e.target.value.replace(/\D/g, '').slice(0, 6))}
            placeholder="000000"
            required
            maxLength={6}
            inputMode="numeric"
            autoComplete="one-time-code"
            autoFocus
          />

          {error && (
            <p className="text-sm text-error text-center">{error}</p>
          )}

          <Button type="submit" className="w-full" loading={verifying}>
            Sign In
          </Button>
        </form>

        <div className="mt-4 space-y-2 text-center">
          <p className="text-xs text-text-dim">Codes refresh every 30 seconds</p>
          <button
            type="button"
            onClick={() => router.push('/auth/totp-setup')}
            className="text-xs text-accent hover:underline"
          >
            First time? Set up TOTP
          </button>
          {process.env.NEXT_PUBLIC_SHARED_TOTP_ENABLED === 'true' && (
            <button
              type="button"
              onClick={() => setShowShared(!showShared)}
              className="text-xs text-accent hover:underline"
            >
              {showShared ? 'Hide' : 'Show'} Team TOTP option
            </button>
          )}
        </div>
      </Card>
    </div>
  )
}
'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Spinner } from '@/components/ui/Spinner'
import { generateTOTPSecret, verifyTOTP, type TOTPSetup } from '@/services/totp'

export default function TOTPSetupPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [setup, setSetup] = useState<Pick<TOTPSetup, 'secret' | 'qrCodeDataUrl' | 'otpauthUrl'> | null>(null)
  const [loading, setLoading] = useState(true)
  const [verifying, setVerifying] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [token, setToken] = useState('')
  const [completed, setCompleted] = useState(false)

  useEffect(() => {
    async function initialize() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        router.replace('/auth/login')
        return
      }

      if (searchParams.get('verified') === 'true') {
        setCompleted(true)
        return
      }

      try {
        const result = await generateTOTPSecret(user.email || user.id)
        setSetup(result)
      } catch {
        setError('Failed to generate TOTP secret')
      } finally {
        setLoading(false)
      }
    }
    initialize()
  }, [router, searchParams])

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!token || token.length !== 6) return
    
    setVerifying(true)
    setError(null)

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      if (!verifyTOTP(token, setup!.secret)) {
        setError('Invalid code. Please try again.')
        setVerifying(false)
        return
      }

      const saveRes = await fetch('/api/auth/totp-setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ secret: setup!.secret }),
      })
      
      if (!saveRes.ok) throw new Error('Failed to save TOTP secret')
      
      const verifyRes = await fetch('/api/auth/totp-verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, email: user.email, mode: 'user' }),
      })
      
      if (!verifyRes.ok) throw new Error('Session creation failed')
      
      router.replace('/projects')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Verification failed')
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

  if (completed) {
    return (
      <div className="flex items-center justify-center min-h-[80vh] px-6">
        <Card className="w-full max-w-sm p-6 text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full border border-accent/25 bg-accent-subtle mb-4 mx-auto">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-accent">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          </div>
          <h1 className="text-lg font-semibold text-text mb-2">TOTP Enabled</h1>
          <p className="text-sm text-text-dim mb-6">Your authenticator app is now linked. You can sign in with 6-digit codes.</p>
          <Button onClick={() => router.push('/projects')} className="w-full">
            Continue to Projects
          </Button>
        </Card>
      </div>
    )
  }

  if (!setup) {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <Spinner size="lg" />
      </div>
    )
  }

  return (
    <div className="flex items-center justify-center min-h-[80vh] px-6">
      <Card className="w-full max-w-sm p-6">
        <h1 className="text-lg font-semibold text-text mb-2">Set Up Authenticator</h1>
        <p className="text-sm text-text-dim mb-6">Scan the QR code with your authenticator app (Google Authenticator, 1Password, Authy, etc.)</p>

        <div className="text-center mb-6">
          <img src={setup.qrCodeDataUrl} alt="TOTP QR Code" className="mx-auto border border-border rounded-lg" />
        </div>

        <div className="space-y-3 mb-6 p-4 bg-surface rounded-lg border border-border">
          <p className="text-xs text-text-dim">Can't scan? Enter this key manually:</p>
          <code className="text-sm font-mono text-text break-all">{setup.secret}</code>
        </div>

        <form onSubmit={handleVerify} className="space-y-4">
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
          />

          {error && (
            <p className="text-sm text-error text-center">{error}</p>
          )}

          <Button type="submit" className="w-full" loading={verifying}>
            Verify & Enable
          </Button>
        </form>

        <p className="mt-4 text-center text-xs text-text-dim">
          Codes refresh every 30 seconds. Enter the current code from your app.
        </p>
      </Card>
    </div>
  )
}
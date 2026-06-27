'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Spinner } from '@/components/ui/Spinner'

export default function ResetPasswordPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [verifying, setVerifying] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  useEffect(() => {
    const init = async () => {
      const { createClient } = await import('@/lib/supabase/client')
      const supabase = createClient()
      const { error } = await supabase.auth.exchangeCodeForSession(window.location.search)
      if (error) {
        setError('Invalid or expired reset link. Please request a new one.')
      }
      setVerifying(false)
    }
    init()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password !== confirm) {
      setError('Passwords do not match')
      return
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const { createClient } = await import('@/lib/supabase/client')
      const { updatePassword } = await import('@/services/auth')
      await updatePassword(createClient(), password)
      setDone(true)
      setTimeout(() => router.push('/projects'), 2000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update password')
    } finally {
      setLoading(false)
    }
  }

  if (verifying) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <Spinner size="lg" />
      </div>
    )
  }

  if (done) {
    return (
      <div className="max-w-sm mx-auto px-4 py-20 text-center space-y-3">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full border border-accent/25 bg-accent-subtle mb-2">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-accent">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
          </svg>
        </div>
        <p className="text-sm font-medium text-text">Password updated</p>
        <p className="text-sm text-text-muted">Redirecting to projects...</p>
      </div>
    )
  }

  return (
    <div className="max-w-sm mx-auto px-4 py-20">
      <h1 className="text-xl font-bold text-text mb-2">Set new password</h1>
      <p className="text-sm text-text-muted mb-6">
        Enter your new password below.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="New Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          minLength={6}
          hint="At least 6 characters"
          required
        />
        <Input
          label="Confirm Password"
          type="password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          placeholder="••••••••"
          required
        />

        {error && <p className="text-sm text-error">{error}</p>}

        <Button type="submit" className="w-full" loading={loading}>
          Update Password
        </Button>
      </form>
    </div>
  )
}

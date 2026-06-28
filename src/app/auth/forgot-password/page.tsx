'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const { createClient } = await import('@/lib/supabase/client')
      const { resetPassword } = await import('@/services/auth')
      await resetPassword(createClient(), email)
      setSent(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send reset email')
    } finally {
      setLoading(false)
    }
  }

  if (sent) {
    return (
      <div className="max-w-sm mx-auto px-4 py-20 text-center space-y-3">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full border border-accent/25 bg-accent-subtle mb-2">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-accent">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
          </svg>
        </div>
        <p className="text-sm font-medium text-text">Check your email</p>
        <p className="text-sm text-text-muted">
          We sent a password reset link to <span className="text-text">{email}</span>
        </p>
        <Link href="/auth/login" className="block text-sm text-accent hover:underline mt-4">
          Back to Sign In
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-sm mx-auto px-4 py-20">
      <h1 className="text-xl font-bold text-text mb-2">Reset your password</h1>
      <p className="text-sm text-text-muted mb-6">
        Enter your email and we&apos;ll send you a reset link.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          required
        />

        {error && <p className="text-sm text-error">{error}</p>}

        <Button type="submit" className="w-full" loading={loading}>
          Send Reset Link
        </Button>
      </form>

      <p className="text-center mt-6 text-sm text-text-dim">
        Remember your password?{' '}
        <Link href="/auth/login" className="text-accent hover:underline">
          Sign In
        </Link>
      </p>
    </div>
  )
}

'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

export function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const { createClient } = await import('@/lib/supabase/client')
      const { signIn } = await import('@/services/auth')
      await signIn(createClient(), email, password)
      window.location.href = '/projects'
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  const handleOAuth = async (provider: 'github' | 'google') => {
    setError(null)
    try {
      const { createClient } = await import('@/lib/supabase/client')
      const fn = provider === 'github'
        ? (await import('@/services/auth')).signInWithGitHub
        : (await import('@/services/auth')).signInWithGoogle

      const { url } = await fn(createClient())
      if (url) window.location.href = url
    } catch (err) {
      setError(err instanceof Error ? err.message : `${provider} login failed`)
    }
  }

  return (
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
        <p className="text-sm text-error">{error}</p>
      )}

      <div className="flex items-center justify-between">
        <p className="text-sm text-text-dim">Don't have an account? <a href="/auth/register" className="text-accent hover:underline">Register</a></p>
        <a href="/auth/forgot-password" className="text-sm text-accent hover:underline">Forgot password?</a>
      </div>

      <Button type="submit" className="w-full" loading={loading}>
        Sign In
      </Button>

      <div className="relative my-5">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center text-xs text-text-dim">
          <span className="bg-surface px-2">or continue with</span>
        </div>
      </div>

      <div className="flex gap-3">
        <Button
          type="button"
          variant="secondary"
          onClick={() => handleOAuth('github')}
          className="flex-1"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" className="mr-1">
            <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
          </svg>
          GitHub
        </Button>
        <Button
          type="button"
          variant="secondary"
          onClick={() => handleOAuth('google')}
          className="flex-1"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" className="mr-1">
            <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .52 5.067.52 11.2s5.347 11.2 11.96 11.2c4.36 0 7.693-1.387 10.2-3.96 2.413-2.467 3.16-5.907 3.16-8.84 0-.813-.067-1.507-.2-2.107H12.48z" />
          </svg>
          Google
        </Button>
      </div>
    </form>
  )
}

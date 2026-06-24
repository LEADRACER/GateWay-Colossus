'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Spinner } from '@/components/ui/Spinner'

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
        <p className="text-sm text-[#ff3355]">{error}</p>
      )}

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? <Spinner size="sm" /> : 'Sign In'}
      </Button>

      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-[#333]" />
        </div>
        <div className="relative flex justify-center text-xs text-[#666]">
          <span className="bg-[#0a0a0a] px-2">or continue with</span>
        </div>
      </div>

      <div className="flex gap-3">
        <Button
          type="button"
          variant="secondary"
          className="flex-1"
          onClick={() => handleOAuth('github')}
        >
          GitHub
        </Button>
        <Button
          type="button"
          variant="secondary"
          className="flex-1"
          onClick={() => handleOAuth('google')}
        >
          Google
        </Button>
      </div>
    </form>
  )
}

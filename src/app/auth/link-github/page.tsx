'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'
import { Spinner } from '@/components/ui/Spinner'
import { AlertCircle, CheckCircle } from 'lucide-react'
import { GithubIcon } from '@/components/ui/GithubIcon'

export default function LinkGithubPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <Spinner size="lg" />
      </div>
    )
  }

  if (!session?.user) {
    return (
      <div className="flex items-center justify-center min-h-[70vh] px-6">
        <Card className="w-full max-w-sm p-6 text-center">
          <GithubIcon className="w-12 h-12 text-accent mx-auto mb-4" />
          <h1 className="text-lg font-semibold text-text mb-2">Sign in first</h1>
          <p className="text-sm text-text-dim mb-6">Sign in with GitHub, then return to link your account.</p>
          <Button className="w-full" onClick={() => router.push('/auth/signin?callbackUrl=/auth/link-github')}>
            <GithubIcon className="w-4 h-4 mr-2" />
            Sign in with GitHub
          </Button>
        </Card>
      </div>
    )
  }

  async function handleLink() {
    if (!email.trim()) return
    setLoading(true)
    setMessage(null)

    try {
      const response = await fetch('/api/auth/link-github', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to link account')
      }

      setMessage({ type: 'success', text: 'Account linked! Redirecting...' })
      setTimeout(() => router.push('/projects'), 1500)
    } catch (e) {
      setMessage({ type: 'error', text: e instanceof Error ? e.message : 'Something went wrong' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center justify-center min-h-[70vh] px-6">
      <Card className="w-full max-w-md p-6">
        <div className="text-center mb-6">
          <GithubIcon className="w-12 h-12 text-accent mx-auto mb-4" />
          <h1 className="text-lg font-semibold text-text">Link Existing Account</h1>
          <p className="text-sm text-text-dim mt-1">
            Signed in as <strong>@{session.user.githubLogin}</strong>
          </p>
          <p className="text-xs text-text-dim mt-2">
            Enter the email of your existing GateWay:Colossus account to link it.
          </p>
        </div>

        {message && (
          <div className={`mb-4 p-3 rounded-lg text-sm flex items-center gap-2 ${
            message.type === 'success' 
              ? 'bg-green-500/10 text-green-400 border border-green-500/20' 
              : 'bg-red-500/10 text-red-400 border border-red-500/20'
          }`}>
            {message.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
            {message.text}
          </div>
        )}

        <form onSubmit={handleLink} className="space-y-4">
          <Input
            label="Email of existing account"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
            disabled={loading}
          />

          <Button type="submit" className="w-full" loading={loading}>
            Link Account
          </Button>
        </form>

        <p className="mt-4 text-center text-xs text-text-dim">
          This will update your profile with GitHub ID and avatar.
          Your projects, likes, and bookmarks will be preserved.
        </p>
      </Card>
    </div>
  )
}
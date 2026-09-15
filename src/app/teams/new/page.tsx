'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'
import { Spinner } from '@/components/ui/Spinner'
import { Users, Lock, Globe, ArrowLeft } from 'lucide-react'

export default function NewTeamPage() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [isPublic, setIsPublic] = useState(true)
  const [isLocked, setIsLocked] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <Spinner size="lg" />
      </div>
    )
  }

  if (!session?.user) {
    return (
      <div className="max-w-xl mx-auto px-6 py-12 text-center">
        <p className="text-text-muted mb-4">Sign in to create a team</p>
        <Link href="/auth/signin?callbackUrl=/teams/new">
          <button className="inline-flex items-center justify-center whitespace-nowrap transition-all duration-150 ease-spring h-9 px-4 text-sm gap-2 rounded-lg bg-accent text-[#050505] font-medium hover:brightness-110 active:brightness-90">
            Sign in with GitHub
          </button>
        </Link>
      </div>
    )
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return

    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/teams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), description: description.trim() || undefined, is_public: isPublic, is_locked: isLocked }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create team')
      }

      router.push(`/teams/${data.code}`)
      router.refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create team')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-xl mx-auto px-6 py-12 md:py-16">
      <div className="flex items-center gap-2 mb-8">
        <Button variant="ghost" size="sm" onClick={() => router.back()} className="gap-1">
          <ArrowLeft size={16} />
          Back
        </Button>
      </div>

      <Card className="p-6 md:p-8">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-accent/10 flex items-center justify-center mx-auto mb-4">
            <Users size={28} className="text-accent" />
          </div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-text">
            Create New Team
          </h1>
          <p className="text-sm text-text-muted mt-2">
            Build a community around your projects
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Input
            label="Team Name"
            placeholder="e.g., Frontend Wizards"
            value={name}
            onChange={e => setName(e.target.value)}
            required
            maxLength={50}
            error={error}
          />

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-text-muted">
              Description (optional)
            </label>
            <textarea
              placeholder="What's this team about?"
              value={description}
              onChange={e => setDescription(e.target.value)}
              maxLength={200}
              rows={3}
              className="w-full rounded-lg border border-border bg-surface px-3.5 py-2.5 text-sm text-text placeholder:text-text-dim transition-all duration-150 focus:outline-none focus:border-accent/50 focus:ring-2 focus:ring-accent-gloss resize-none"
            />
          </div>

          <div className="space-y-4 pt-2 border-t border-border">
            <h3 className="text-sm font-medium text-text">Visibility</h3>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className={`relative flex items-center gap-3 p-4 rounded-lg border-2 transition-colors cursor-pointer ${
                isPublic
                  ? 'border-accent bg-accent/5'
                  : 'border-border bg-surface hover:border-accent/20'
              }`}>
                <input
                  type="radio"
                  name="visibility"
                  value="public"
                  checked={isPublic}
                  onChange={() => setIsPublic(true)}
                  className="sr-only"
                />
                <div className="flex items-center gap-3">
                  <Globe size={20} className="text-accent shrink-0" />
                  <div>
                    <p className="font-medium text-text">Public</p>
                    <p className="text-xs text-text-dim">Anyone can discover and request to join</p>
                  </div>
                </div>
              </label>
              <label className={`relative flex items-center gap-3 p-4 rounded-lg border-2 transition-colors cursor-pointer ${
                !isPublic
                  ? 'border-accent bg-accent/5'
                  : 'border-border bg-surface hover:border-accent/20'
              }`}>
                <input
                  type="radio"
                  name="visibility"
                  value="private"
                  checked={!isPublic}
                  onChange={() => setIsPublic(false)}
                  className="sr-only"
                />
                <div className="flex items-center gap-3">
                  <Lock size={20} className="text-warning shrink-0" />
                  <div>
                    <p className="font-medium text-text">Private</p>
                    <p className="text-xs text-text-dim">Only invited members can join</p>
                  </div>
                </div>
              </label>
            </div>

            <label className="relative flex items-center gap-3 p-4 rounded-lg border-2 transition-colors cursor-pointer">
              <input
                type="checkbox"
                checked={isLocked}
                onChange={e => setIsLocked(e.target.checked)}
                className="sr-only peer"
              />
              <div className="flex items-center gap-3">
                <div className={`w-5 h-5 rounded border-2 transition-colors peer-checked:border-accent peer-checked:bg-accent peer-checked:text-white flex items-center justify-center`}>
                  <Lock size={14} className="peer-checked:block hidden" />
                </div>
                <div>
                  <p className="font-medium text-text">Lock team</p>
                  <p className="text-xs text-text-dim">Prevent join requests (members can still be invited)</p>
                </div>
              </div>
            </label>
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-error/10 border border-error/20 text-error text-sm">
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <Button variant="secondary" type="button" onClick={() => router.back()} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" className="flex-1" loading={loading}>
              Create Team
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}
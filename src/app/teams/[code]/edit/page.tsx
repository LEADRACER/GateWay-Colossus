'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Image from 'next/image'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'
import { Spinner } from '@/components/ui/Spinner'
import { ToastProvider, useToast } from '@/components/ui/Toast'
import { ChevronLeft, Save, Lock, Globe, Image as ImageIcon, X } from 'lucide-react'
import type { Team } from '@/lib/types/database'

export default function EditTeamPage() {
  const params = useParams()
  const code = params.code as string
  const router = useRouter()
  const { data: session, status } = useSession()
  const { toast } = useToast()
  const [team, setTeam] = useState<Team | null>(null)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [isPublic, setIsPublic] = useState(true)
  const [isLocked, setIsLocked] = useState(false)
  const [avatarUrl, setAvatarUrl] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/teams/${code}`)
      if (response.ok) {
        const data = await response.json()
        setTeam(data.team)
        setName(data.team.name)
        setDescription(data.team.description || '')
        setIsPublic(data.team.is_public)
        setIsLocked(data.team.is_locked)
        setAvatarUrl(data.team.avatar_url || '')
        setAvatarPreview(data.team.avatar_url || null)
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to load team', type: 'error' })
    } finally {
      setLoading(false)
    }
  }, [code, toast])

  useEffect(() => {
    if (status !== 'loading') load()
  }, [status, code, load])

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <Spinner size="lg" />
      </div>
    )
  }

  if (!team) {
    return (
      <div className="max-w-xl mx-auto px-6 py-12 text-center">
        <p className="text-error mb-4">Team not found</p>
        <Link href="/teams">
          <Button variant="secondary">Browse Teams</Button>
        </Link>
      </div>
    )
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      const response = await fetch(`/api/teams/${code}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || undefined,
          is_public: isPublic,
          is_locked: isLocked,
          avatar_url: avatarPreview || undefined,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to update team')
      }

      toast({ title: 'Saved', description: 'Team updated successfully', type: 'success' })
      router.push(`/teams/${code}`)
    } catch (e) {
      toast({ title: 'Error', description: e instanceof Error ? e.message : 'Failed to save', type: 'error' })
    } finally {
      setSaving(false)
    }
  }

  function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      toast({ title: 'Error', description: 'Please select an image file', type: 'error' })
      return
    }

    if (file.size > 2 * 1024 * 1024) {
      toast({ title: 'Error', description: 'Image must be less than 2MB', type: 'error' })
      return
    }

    const reader = new FileReader()
    reader.onload = (e) => {
      setAvatarPreview(e.target?.result as string)
    }
    reader.readAsDataURL(file)
  }

  function removeAvatar() {
    setAvatarPreview(null)
    setAvatarUrl('')
  }

  return (
    <ToastProvider>
      <div className="max-w-xl mx-auto px-6 py-12 md:py-16">
        <div className="flex items-center gap-2 mb-8">
          <Button variant="ghost" size="sm" onClick={() => router.back()} className="gap-1">
            <ChevronLeft size={16} />
            Back
          </Button>
        </div>

        <Card className="p-6 md:p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-accent/10 flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl font-bold text-accent">{team.name.charAt(0).toUpperCase()}</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-text">
              Edit Team
            </h1>
            <p className="text-sm text-text-muted mt-2">
              Update your team's details and settings
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
              <h3 className="text-sm font-medium text-text">Team Avatar</h3>
              <div className="flex items-center gap-4">
                <div className="relative w-20 h-20 rounded-full bg-surface-alt ring-1 ring-border overflow-hidden flex items-center justify-center shrink-0">
                  {avatarPreview ? (
                    <Image src={avatarPreview} alt="Team avatar" width={80} height={80} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-2xl font-bold text-accent">{team.name.charAt(0).toUpperCase()}</span>
                  )}
                  {avatarPreview && (
                    <button
                      type="button"
                      onClick={removeAvatar}
                      className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-error/90 text-white flex items-center justify-center text-xs hover:bg-error"
                    >
                      <X size={12} />
                    </button>
                  )}
                </div>
                <div className="flex-1">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    className="sr-only"
                    id="avatar-upload"
                  />
                  <label htmlFor="avatar-upload" className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-border bg-surface text-text hover:bg-surface-alt cursor-pointer transition-colors">
                    <ImageIcon size={16} />
                    {avatarPreview ? 'Change Avatar' : 'Upload Avatar'}
                  </label>
                  <p className="text-xs text-text-dim">Max 2MB. JPG, PNG, or WebP.</p>
                </div>
              </div>

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

            <div className="flex gap-3 pt-4">
              <Button variant="secondary" type="button" onClick={() => router.back()} className="flex-1">
                Cancel
              </Button>
              <Button type="submit" loading={saving} className="flex-1">
                <Save size={14} /> Save Changes
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </ToastProvider>
  )
}
'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Image from 'next/image'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Spinner } from '@/components/ui/Spinner'
import { EmptyState } from '@/components/ui/EmptyState'
import { ToastProvider, useToast } from '@/components/ui/Toast'
import { Search, Plus, UserMinus, Shield, UserX, Mail, ChevronLeft } from 'lucide-react'
import type { Team, TeamMember } from '@/lib/types/database'

export default function TeamMembersPage() {
  const params = useParams()
  const code = params.code as string
  const router = useRouter()
  const { data: session, status } = useSession()
  const { toast } = useToast()
  const [team, setTeam] = useState<Team | null>(null)
  const [members, setMembers] = useState<TeamMember[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [inviting, setInviting] = useState(false)
  const [inviteUsername, setInviteUsername] = useState('')
  const [inviteRole, setInviteRole] = useState<'admin' | 'member'>('member')
  const [searchResults, setSearchResults] = useState<{ id: string; login: string; avatar_url?: string }[]>([])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/teams/${code}`)
      if (response.ok) {
        const data = await response.json()
        setTeam(data.team)
        setMembers(data.members || [])
      }
    } catch {
    } finally {
      setLoading(false)
    }
  }, [code])

  useEffect(() => {
    if (status !== 'loading') load()
  }, [status, code, load])

  const currentUserId = session?.user?.githubId?.toString()
  const currentMember = members.find(m => m.user_id === currentUserId)
  const isLeader = currentMember?.role === 'leader'
  const isAdmin = ['leader', 'admin'].includes(currentMember?.role || '')

  const filteredMembers = members.filter(m =>
    m.login?.toLowerCase().includes(search.toLowerCase())
  )

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault()
    if (!inviteUsername.trim() || !team) return

    setInviting(true)
    try {
      const response = await fetch(`/api/teams/${team.code}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetLogin: inviteUsername.trim(), role: inviteRole }),
      })

      const data = await response.json()

      if (!response.ok) throw new Error(data.error || 'Failed to invite')

      toast({ title: 'Invited', description: `${inviteUsername} has been added to the team`, type: 'success' })
      setInviteUsername('')
      setSearchResults([])
      await load()
    } catch (e) {
      toast({ title: 'Error', description: e instanceof Error ? e.message : 'Failed to invite', type: 'error' })
    } finally {
      setInviting(false)
    }
  }

  async function handleRemove(memberId: string) {
    if (!team) return
    if (!confirm('Remove this member from the team?')) return

    try {
      const response = await fetch(`/api/teams/${team.code}/members/${memberId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to remove member')
      }

      toast({ title: 'Removed', description: 'Member has been removed from the team', type: 'success' })
      await load()
    } catch (e) {
      toast({ title: 'Error', description: e instanceof Error ? e.message : 'Failed to remove', type: 'error' })
    }
  }

  async function handleRoleChange(memberId: string, newRole: 'admin' | 'member') {
    if (!team) return

    try {
      const response = await fetch(`/api/teams/${team.code}/members/${memberId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to update role')
      }

      toast({ title: 'Updated', description: 'Member role updated', type: 'success' })
      await load()
    } catch (e) {
      toast({ title: 'Error', description: e instanceof Error ? e.message : 'Failed to update', type: 'error' })
    }
  }

  async function handleSearchUsers() {
    if (!inviteUsername.trim() || inviteUsername.length < 2) {
      setSearchResults([])
      return
    }

    try {
      const response = await fetch(`/api/users/search?q=${encodeURIComponent(inviteUsername)}&limit=5`)
      if (response.ok) {
        const data = await response.json()
        setSearchResults(data.filter((u: any) => !members.some(m => m.user_id === u.id)))
      }
    } catch {
    }
  }

  useEffect(() => {
    const timeout = setTimeout(handleSearchUsers, 300)
    return () => clearTimeout(timeout)
  }, [inviteUsername])

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <Spinner size="lg" />
      </div>
    )
  }

  if (!team) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-12 text-center">
        <p className="text-error mb-4">Team not found</p>
        <Link href="/teams">
          <Button variant="secondary">Browse Teams</Button>
        </Link>
      </div>
    )
  }

  return (
    <ToastProvider>
      <div className="max-w-4xl mx-auto px-6 py-12 md:py-16">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => router.back()} className="gap-1">
              <ChevronLeft size={16} />
              Back
            </Button>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-text">{team.name}</h1>
              <p className="text-sm text-text-muted">Manage Members</p>
            </div>
          </div>
        </div>

        <div className="mb-6">
          <div className="relative max-w-md">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-dim" aria-hidden="true" />
            <input
              type="text"
              placeholder="Search members..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-border bg-surface text-text placeholder:text-text-dim/50 focus:outline-none focus:border-accent/50"
            />
          </div>
        </div>

        {(isLeader || isAdmin) && (
          <form onSubmit={handleInvite} className="mb-8 p-5 rounded-lg border border-border bg-surface">
            <h3 className="font-medium text-text mb-4 flex items-center gap-2">
              <Plus size={18} /> Invite Member
            </h3>
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Input
                  placeholder="GitHub username"
                  value={inviteUsername}
                  onChange={e => setInviteUsername(e.target.value)}
                  required
                />
                {searchResults.length > 0 && (
                  <div className="absolute z-10 mt-1 w-full bg-surface border border-border rounded-lg shadow-lg max-h-40 overflow-auto">
                    {searchResults.map(user => (
                      <button
                        key={user.id}
                        type="button"
                        onClick={() => {
                          setInviteUsername(user.login)
                          setSearchResults([])
                        }}
                        className="w-full px-3 py-2 text-left hover:bg-surface-alt flex items-center gap-2 text-sm"
                      >
                        {user.avatar_url ? (
                          <Image src={user.avatar_url} alt={user.login} width={24} height={24} className="w-6 h-6 rounded-full" />
                        ) : (
                          <div className="w-6 h-6 rounded-full bg-surface-alt flex items-center justify-center">
                            <span className="text-xs font-medium text-text-dim">{user.login.charAt(0).toUpperCase()}</span>
                          </div>
                        )}
                        <span className="font-medium">{user.login}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <select
                value={inviteRole}
                onChange={e => setInviteRole(e.target.value as 'admin' | 'member')}
                className="px-3 py-2 rounded-lg border border-border bg-surface text-text"
              >
                <option value="member">Member</option>
                <option value="admin">Admin</option>
              </select>
              <Button type="submit" loading={inviting} className="whitespace-nowrap">
                <Plus size={14} /> Invite
              </Button>
            </div>
          </form>
        )}

        <h3 className="font-semibold text-text mb-4">Members ({members.length})</h3>

        {loading ? (
          <div className="flex justify-center py-12"><Spinner /></div>
        ) : filteredMembers.length === 0 ? (
          <EmptyState
            title={search ? 'No matching members' : 'No members yet'}
            description={search ? 'Try adjusting your search.' : 'Invite members to start building together.'}
          />
        ) : (
          <div className="space-y-2">
            {filteredMembers.map((member) => (
              <div key={member.id} className="flex items-center gap-4 p-4 rounded-lg border border-border bg-surface">
                {member.avatar_url ? (
                  <Image src={member.avatar_url} alt={member.login || ''} width={40} height={40} className="w-10 h-10 rounded-full ring-1 ring-border shrink-0" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-surface-alt ring-1 ring-border flex items-center justify-center shrink-0">
                    <span className="text-sm font-medium text-text-dim">{(member.login || '?').charAt(0).toUpperCase()}</span>
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <Link href={`/profile/${member.user_id}`} className="font-medium text-text hover:text-accent truncate block">
                    {member.login || 'Unknown'}
                  </Link>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`px-2 py-0.5 text-[10px] font-medium rounded-full ${
                      member.role === 'leader' ? 'bg-accent/10 text-accent' :
                      member.role === 'admin' ? 'bg-info/10 text-info' :
                      'bg-surface-alt text-text-dim'
                    }`}>
                      {member.role}
                    </span>
                    {member.status !== 'active' && (
                      <span className="px-2 py-0.5 text-[10px] font-medium rounded-full border border-warning/30 bg-warning/10 text-warning">
                        {member.status}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-text-dim">{member.joined_at ? new Date(member.joined_at).toLocaleDateString() : '—'}</p>
                </div>
                {(isLeader || isAdmin) && member.user_id !== currentUserId && member.role !== 'leader' && (
                  <div className="flex items-center gap-2">
                    <select
                      defaultValue={member.role}
                      onChange={(e) => handleRoleChange(member.id, e.target.value as 'admin' | 'member')}
                      className="px-2 py-1 text-sm rounded-lg border border-border bg-surface text-text"
                    >
                      <option value="admin">Admin</option>
                      <option value="member">Member</option>
                    </select>
                    <Button variant="ghost" size="sm" onClick={() => handleRemove(member.id)} className="text-error hover:text-error/80">
                      <UserX size={14} />
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </ToastProvider>
  )
}
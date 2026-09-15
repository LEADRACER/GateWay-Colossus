'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { useSession } from 'next-auth/react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'
import { EmptyState } from '@/components/ui/EmptyState'
import { TeamCard } from '@/components/features/team/TeamCard'
import type { Team, TeamMember, TeamJoinRequest } from '@/lib/types/database'
import { Users, Plus, Settings, UsersRound, FolderKanban, Mail, ChevronRight } from 'lucide-react'

interface TeamData {
  team: Team | null
  members: TeamMember[]
  joinRequests: TeamJoinRequest[]
  projects: any[]
  loading: boolean
  error: string | null
}

export default function TeamProfilePage() {
  const params = useParams()
  const code = params.code as string
  const router = useRouter()
  const { data: session, status } = useSession()
  const [data, setData] = useState<TeamData>({
    team: null,
    members: [],
    joinRequests: [],
    projects: [],
    loading: true,
    error: null,
  })
  const [activeTab, setActiveTab] = useState<'overview' | 'members' | 'projects' | 'requests'>('overview')

  const load = useCallback(async () => {
    setData(prev => ({ ...prev, loading: true, error: null }))
    try {
      const response = await fetch(`/api/teams/${code}`)
      if (!response.ok) throw new Error('Team not found')
      const result = await response.json()
      setData({
        team: result.team,
        members: result.members || [],
        joinRequests: result.joinRequests || [],
        projects: result.projects || [],
        loading: false,
        error: null,
      })
    } catch (e) {
      setData(prev => ({ ...prev, loading: false, error: e instanceof Error ? e.message : 'Failed to load team' }))
    }
  }, [code])

  useEffect(() => {
    if (status !== 'loading') load()
  }, [status, code, load])

  const { team, members, joinRequests, projects, loading, error } = data
  const userGithubId = session?.user?.githubId?.toString()
  const isLeader = session?.user && team && team.leader_id === userGithubId
  const isAdmin = session?.user && members.some(m => m.user_id === userGithubId && ['leader', 'admin'].includes(m.role))
  const isMember = session?.user && members.some(m => m.user_id === userGithubId && m.status === 'active')
  const pendingRequests = joinRequests.filter(r => r.status === 'pending').length

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <Spinner size="lg" />
      </div>
    )
  }

  if (error || !team) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-12 text-center">
        <p className="text-error mb-4">{error || 'Team not found'}</p>
        <Link href="/teams">
          <Button variant="secondary">Browse Teams</Button>
        </Link>
      </div>
    )
  }

  const pendingMember = isMember ? members.find(m => m.user_id === userGithubId && m.status === 'pending') : null

  return (
    <div className="max-w-4xl mx-auto px-6 py-12 md:py-16">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-start gap-4 mb-6">
          {team.avatar_url ? (
            <Image src={team.avatar_url} alt={team.name} width={80} height={80} className="w-20 h-20 rounded-full ring-2 ring-border shrink-0" />
          ) : (
            <div className="w-20 h-20 rounded-full bg-accent-subtle ring-2 ring-border flex items-center justify-center shrink-0">
              <span className="text-3xl font-bold text-accent">{team.name.charAt(0).toUpperCase()}</span>
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap mb-2">
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-text truncate">{team.name}</h1>
              <span className="text-sm font-mono text-text-dim">#{team.code}</span>
              {team.is_locked && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-medium rounded-full border border-warning/30 bg-warning/10 text-warning">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                  Locked
                </span>
              )}
              {!team.is_public && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-medium rounded-full border border-info/30 bg-info/10 text-info">
                  Private
                </span>
              )}
            </div>
            {team.description && (
              <p className="text-text-muted mb-2">{team.description}</p>
            )}
            <div className="flex items-center gap-6 text-sm text-text-dim">
              <span className="flex items-center gap-1.5">
                <Users size={14} />
                {team.member_count} member{team.member_count !== 1 ? 's' : ''}
              </span>
              <span className="flex items-center gap-1.5">
                <FolderKanban size={14} /> Projects ({projects.length || 0})
              </span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-2">
          {pendingMember && (
            <Button variant="secondary" className="gap-1" disabled>
              <Mail size={14} /> Invitation Pending
            </Button>
          )}
          {isMember && !pendingMember && (
            <Button variant="secondary" onClick={() => setActiveTab('projects')}>
              <FolderKanban size={14} /> View Projects
            </Button>
          )}
          {isLeader && (
            <Link href={`/teams/${team.code}/edit`}>
              <Button variant="ghost" size="sm">
                <Settings size={14} /> Edit Team
              </Button>
            </Link>
          )}
          {!isMember && (
            <Button
              variant={team.is_public && !team.is_locked ? 'primary' : 'secondary'}
              disabled={!team.is_public || team.is_locked}
              onClick={() => setActiveTab('requests')}
              className="gap-1"
            >
              <Mail size={14} />
              {team.is_locked ? 'Team Locked' : team.is_public ? 'Request to Join' : 'Private Team'}
            </Button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue={activeTab} onValueChange={(value) => setActiveTab(value as 'overview' | 'members' | 'projects' | 'requests')} className="w-full">
        <TabsList className="grid w-full grid-cols-4 mb-6">
          <TabsTrigger value="overview" className="gap-2">
            <FolderKanban size={14} /> Overview
          </TabsTrigger>
          <TabsTrigger value="members" className="gap-2">
            <UsersRound size={14} /> Members ({team.member_count})
          </TabsTrigger>
          <TabsTrigger value="projects" className="gap-2">
            <FolderKanban size={14} /> Projects ({projects.length || 0})
          </TabsTrigger>
          <TabsTrigger value="requests" className="relative gap-2">
            <Mail size={14} /> Requests
            {pendingRequests > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-accent text-white text-[10px] font-medium flex items-center justify-center">
                {pendingRequests > 9 ? '9+' : pendingRequests}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {team.description ? (
            <div className="p-5 rounded-lg border border-border bg-surface">
              <h3 className="font-medium text-text mb-2">About</h3>
              <p className="text-text-muted whitespace-pre-wrap">{team.description}</p>
            </div>
          ) : (
            <p className="text-text-dim text-center py-10">No description yet.</p>
          )}

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="p-4 rounded-lg border border-border bg-surface text-center">
              <p className="text-2xl font-bold text-text">{team.member_count}</p>
              <p className="text-sm text-text-dim">Members</p>
            </div>
            <div className="p-4 rounded-lg border border-border bg-surface text-center">
              <p className="text-2xl font-bold text-text">{projects.length || 0}</p>
              <p className="text-sm text-text-dim">Projects</p>
            </div>
            <div className="p-4 rounded-lg border border-border bg-surface text-center">
              <p className="text-2xl font-bold text-text">{team.created_at ? new Date(team.created_at).toLocaleDateString() : '—'}</p>
              <p className="text-sm text-text-dim">Created</p>
            </div>
          </div>
        </TabsContent>

        {/* Members Tab */}
        <TabsContent value="members" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-text">Members</h3>
            {(isLeader || isAdmin) && (
              <Link href={`/teams/${team.code}/members`}>
                <Button size="sm" variant="secondary">
                  <Plus size={14} /> Invite
                </Button>
              </Link>
            )}
          </div>

          {loading ? (
            <div className="flex justify-center py-12"><Spinner /></div>
          ) : members.length === 0 ? (
            <EmptyState title="No members yet" description="Invite members to start building together." />
          ) : (
            <div className="space-y-2">
              {members.map((member) => (
                <div key={member.id} className="flex items-center gap-4 p-4 rounded-lg border border-border bg-surface">
                  {member.avatar_url ? (
                    <Image src={member.avatar_url} alt={member.login || ''} width={40} height={40} className="w-10 h-10 rounded-full ring-1 ring-border shrink-0" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-surface-alt ring-1 ring-border flex items-center justify-center shrink-0">
                      <span className="text-sm font-medium text-text-dim">{(member.login || '?').charAt(0).toUpperCase()}</span>
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Link href={`/profile/${member.user_id}`} className="font-medium text-text hover:text-accent truncate block">
                        {member.login || 'Unknown'}
                      </Link>
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
                  {(isLeader || isAdmin) && member.user_id !== userGithubId && member.role !== 'leader' && (
                    <div className="flex items-center gap-2">
                      <select
                        defaultValue={member.role}
                        onChange={(e) => {
                          // TODO: update role
                        }}
                        className="px-2 py-1 text-sm rounded-lg border border-border bg-surface text-text"
                      >
                        <option value="admin">Admin</option>
                        <option value="member">Member</option>
                      </select>
                      <Button variant="ghost" size="sm" className="text-error hover:text-error/80">
                        Remove
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Projects Tab */}
        <TabsContent value="projects" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-text">Team Projects</h3>
            {(isLeader || isAdmin) && (
              <Link href="/projects/new">
                <Button size="sm">
                  <Plus size={14} /> Add Project
                </Button>
              </Link>
            )}
          </div>

          {projects.length === 0 ? (
            <EmptyState
              title="No projects yet"
              description="Add projects to showcase your team's work."
              action={
                <Link href="/projects/new">
                  <Button>
                    <Plus size={14} /> Add Project
                  </Button>
                </Link>
              }
            />
          ) : (
            <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}>
              {projects.map((project) => (
                <TeamCard key={project.id} team={{ ...project, name: project.name, code: project.id, member_count: 0, is_locked: false, is_public: true, leader_id: '', created_at: '', updated_at: '' }} />
              ))}
            </div>
          )}
        </TabsContent>

        {/* Join Requests Tab */}
        <TabsContent value="requests" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-text">Join Requests</h3>
            {pendingRequests > 0 && (
              <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-accent/10 text-accent">
                {pendingRequests} pending
              </span>
            )}
          </div>

          {joinRequests.length === 0 ? (
            <EmptyState title="No join requests" description="Requests will appear here when users ask to join your team." />
          ) : (
            <div className="space-y-3">
              {joinRequests.map((request) => (
                <div key={request.id} className="flex items-center gap-4 p-4 rounded-lg border border-border bg-surface">
                  {request.avatar_url ? (
                    <Image src={request.avatar_url} alt={request.login || ''} width={40} height={40} className="w-10 h-10 rounded-full ring-1 ring-border shrink-0" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-surface-alt ring-1 ring-border flex items-center justify-center shrink-0">
                      <span className="text-sm font-medium text-text-dim">{(request.login || '?').charAt(0).toUpperCase()}</span>
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <Link href={`/profile/${request.user_id}`} className="font-medium text-text hover:text-accent truncate block">
                      {request.login || 'Unknown'}
                    </Link>
                    <p className="text-sm text-text-dim mt-1">{request.message || 'No message'}</p>
                    <p className="text-xs text-text-dim mt-1">Requested {new Date(request.created_at).toLocaleDateString()}</p>
                  </div>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    request.status === 'pending' ? 'bg-warning/10 text-warning' :
                    request.status === 'accepted' ? 'bg-success/10 text-success' :
                    'bg-error/10 text-error'
                  }`}>
                    {request.status}
                  </span>
                  {request.status === 'pending' && (isLeader || isAdmin) && (
                    <div className="flex gap-2">
                      <Button size="sm" variant="secondary" className="gap-1">
                        Accept
                      </Button>
                      <Button size="sm" variant="ghost" className="text-error">
                        Reject
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { getMemberPermissions, toggleCanAddProject, getPermissionRequests, handlePermissionRequest } from '@/services/admin'
import type { MemberPermission, PermissionRequest } from '@/services/admin'
import { Spinner } from '@/components/ui/Spinner'
import { Search, Shield, User, Crown, Check, X } from 'lucide-react'

export default function PermissionsPage() {
  const [members, setMembers] = useState<MemberPermission[]>([])
  const [requests, setRequests] = useState<PermissionRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [updating, setUpdating] = useState<string | null>(null)
  const [tab, setTab] = useState<'members' | 'requests'>('members')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const supabase = createClient()
      const [m, r] = await Promise.all([
        getMemberPermissions(supabase),
        getPermissionRequests(supabase),
      ])
      setMembers(m)
      setRequests(r)
    } catch {
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  async function handleToggle(userId: string, current: boolean) {
    setUpdating(userId)
    try {
      const supabase = createClient()
      await toggleCanAddProject(supabase, userId, !current)
      setMembers(prev => prev.map(u => u.id === userId ? { ...u, can_add_projects: !current } : u))
    } catch {
    } finally {
      setUpdating(null)
    }
  }

  async function handleRequestAction(requestId: string, userId: string, action: 'approve' | 'deny') {
    setUpdating(requestId)
    try {
      const supabase = createClient()
      await handlePermissionRequest(supabase, requestId, action)
      // Refresh both
      const [m, r] = await Promise.all([
        getMemberPermissions(supabase),
        getPermissionRequests(supabase),
      ])
      setMembers(m)
      setRequests(r)
    } catch {
    } finally {
      setUpdating(null)
    }
  }

  const filtered = members.filter(u =>
    !search || u.username?.toLowerCase().includes(search.toLowerCase())
  )

  if (loading) {
    return (
      <div className="flex justify-center items-center py-24">
        <Spinner size="lg" />
      </div>
    )
  }

  return (
    <div className="animate-fade-in">
      {/* Tabs */}
      <div style={{ display: 'flex', gap: 0, marginBottom: 20, borderBottom: '1px solid var(--color-border)' }}>
        <button
          onClick={() => setTab('members')}
          style={{
            padding: '10px 20px', border: 'none', cursor: 'pointer',
            background: 'transparent',
            fontSize: 13, fontWeight: 500,
            color: tab === 'members' ? 'var(--color-accent)' : 'var(--color-text-dim)',
            borderBottom: tab === 'members' ? '2px solid var(--color-accent)' : '2px solid transparent',
            transition: 'all 0.12s',
          }}
        >
          Members ({members.length})
        </button>
        <button
          onClick={() => setTab('requests')}
          style={{
            padding: '10px 20px', border: 'none', cursor: 'pointer',
            background: 'transparent',
            fontSize: 13, fontWeight: 500,
            color: tab === 'requests' ? 'var(--color-accent)' : 'var(--color-text-dim)',
            borderBottom: tab === 'requests' ? '2px solid var(--color-accent)' : '2px solid transparent',
            transition: 'all 0.12s',
            display: 'flex', alignItems: 'center', gap: 6,
          }}
        >
          Requests
          {requests.filter(r => r.status === 'pending').length > 0 && (
            <span style={{
              background: 'var(--color-accent)', color: '#fff',
              fontSize: 11, fontWeight: 700,
              padding: '1px 6px', borderRadius: 10,
            }}>
              {requests.filter(r => r.status === 'pending').length}
            </span>
          )}
        </button>
      </div>

      {tab === 'members' ? (
        <>
          {/* Search */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
            <p style={{ fontSize: 14, color: 'var(--color-text-muted)' }}>
              {members.length} member{members.length !== 1 ? 's' : ''} — toggle project add permission
            </p>
            <div style={{ position: 'relative' }}>
              <Search size={14} color="var(--color-text-dim)" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)' }} />
              <input type="text" placeholder="Search members..." value={search}
                onChange={e => setSearch(e.target.value)}
                style={{
                  padding: '8px 12px 8px 30px', borderRadius: 8,
                  border: '1px solid var(--color-border)',
                  background: 'var(--color-surface)',
                  fontSize: 13, color: 'var(--color-text)',
                  outline: 'none', width: 220,
                }}
                onFocus={e => e.target.style.borderColor = 'var(--color-accent)'}
                onBlur={e => e.target.style.borderColor = 'var(--color-border)'}
              />
            </div>
          </div>

          {/* Members table */}
          <div style={{
            background: 'var(--color-surface)',
            borderRadius: 12,
            border: '1px solid var(--color-border)',
            overflow: 'hidden',
          }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--color-border)', background: 'var(--color-surface-2)' }}>
                  <th style={{ textAlign: 'left', padding: '12px 16px', fontWeight: 500, color: 'var(--color-text-dim)', fontSize: 11.5 }}>User</th>
                  <th style={{ textAlign: 'left', padding: '12px 16px', fontWeight: 500, color: 'var(--color-text-dim)', fontSize: 11.5 }}>Role</th>
                  <th style={{ textAlign: 'left', padding: '12px 16px', fontWeight: 500, color: 'var(--color-text-dim)', fontSize: 11.5 }}>Projects</th>
                  <th style={{ textAlign: 'center', padding: '12px 16px', fontWeight: 500, color: 'var(--color-text-dim)', fontSize: 11.5 }}>Can Add Projects</th>
                  <th style={{ textAlign: 'right', padding: '12px 16px', fontWeight: 500, color: 'var(--color-text-dim)', fontSize: 11.5 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((user) => {
                  const isUpdating = updating === user.id
                  return (
                    <tr key={user.id} style={{
                      borderBottom: '1px solid var(--color-border-light)',
                      opacity: isUpdating ? 0.5 : 1,
                      transition: 'opacity 0.2s',
                    }}>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{
                            width: 28, height: 28, borderRadius: '50%',
                            background: 'var(--color-surface-2)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                          }}>
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: 'var(--color-text-dim)' }}>
                              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                              <circle cx="12" cy="7" r="4" />
                            </svg>
                          </div>
                          <div>
                            <div style={{ fontWeight: 500, color: 'var(--color-text)' }}>{user.username || 'Anonymous'}</div>
                            <div style={{ fontSize: 11, color: 'var(--color-text-dim)', fontFamily: 'monospace' }}>{user.id.slice(0, 8)}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{
                          padding: '3px 10px', borderRadius: 12,
                          background: user.role === 'admin' ? 'var(--color-accent-bg)' : 'var(--color-info-bg)',
                          color: user.role === 'admin' ? 'var(--color-accent)' : 'var(--color-info)',
                          fontSize: 11, fontWeight: 600,
                        }}>
                          {user.role}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px', color: 'var(--color-text-muted)' }}>
                        {user.project_count}
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                        <span style={{
                          display: 'inline-flex', alignItems: 'center', gap: 4,
                          padding: '2px 8px', borderRadius: 6,
                          background: user.can_add_projects ? 'var(--color-success-bg, #0f2a1a)' : 'var(--color-surface-2)',
                          color: user.can_add_projects ? 'var(--color-success, #4ade80)' : 'var(--color-text-dim)',
                          fontSize: 11, fontWeight: 600,
                        }}>
                          {user.can_add_projects ? '✓ Allowed' : '— Denied'}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                        <button
                          onClick={() => handleToggle(user.id, user.can_add_projects)}
                          disabled={isUpdating}
                          style={{
                            padding: '6px 12px', borderRadius: 6,
                            border: '1px solid var(--color-border)',
                            background: user.can_add_projects ? 'var(--color-error-bg, #2a0f0f)' : 'var(--color-accent-bg)',
                            color: user.can_add_projects ? 'var(--color-error, #f87171)' : 'var(--color-accent)',
                            cursor: isUpdating ? 'default' : 'pointer',
                            fontSize: 12, fontWeight: 500,
                            opacity: isUpdating ? 0.6 : 1,
                          }}
                        >
                          {isUpdating ? '...' : user.can_add_projects ? 'Revoke' : 'Grant'}
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <>
          {/* Requests tab */}
          <div style={{
            background: 'var(--color-surface)',
            borderRadius: 12,
            border: '1px solid var(--color-border)',
            overflow: 'hidden',
          }}>
            {requests.length === 0 ? (
              <div style={{ padding: 40, textAlign: 'center', color: 'var(--color-text-dim)', fontSize: 14 }}>
                No permission requests yet
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--color-border)', background: 'var(--color-surface-2)' }}>
                    <th style={{ textAlign: 'left', padding: '12px 16px', fontWeight: 500, color: 'var(--color-text-dim)', fontSize: 11.5 }}>User</th>
                    <th style={{ textAlign: 'left', padding: '12px 16px', fontWeight: 500, color: 'var(--color-text-dim)', fontSize: 11.5 }}>Status</th>
                    <th style={{ textAlign: 'left', padding: '12px 16px', fontWeight: 500, color: 'var(--color-text-dim)', fontSize: 11.5 }}>Requested</th>
                    <th style={{ textAlign: 'right', padding: '12px 16px', fontWeight: 500, color: 'var(--color-text-dim)', fontSize: 11.5 }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {requests.map((req) => {
                    const isUpdating = updating === req.id
                    return (
                      <tr key={req.id} style={{
                        borderBottom: '1px solid var(--color-border-light)',
                        opacity: isUpdating ? 0.5 : 1,
                        transition: 'opacity 0.2s',
                      }}>
                        <td style={{ padding: '12px 16px' }}>
                          <div style={{ fontWeight: 500, color: 'var(--color-text)' }}>
                            {req.username || 'Unknown'}
                          </div>
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <span style={{
                            padding: '3px 10px', borderRadius: 12,
                            background: req.status === 'pending' ? 'var(--color-warning-bg, #1a1a0f)' 
                              : req.status === 'approved' ? 'var(--color-success-bg, #0f2a1a)' 
                              : 'var(--color-surface-2)',
                            color: req.status === 'pending' ? 'var(--color-warning, #facc15)'
                              : req.status === 'approved' ? 'var(--color-success, #4ade80)'
                              : 'var(--color-text-dim)',
                            fontSize: 11, fontWeight: 600,
                          }}>
                            {req.status}
                          </span>
                        </td>
                        <td style={{ padding: '12px 16px', color: 'var(--color-text-dim)', fontSize: 12 }}>
                          {new Date(req.created_at).toLocaleDateString()} {new Date(req.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                          {req.status === 'pending' ? (
                            <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                              <button
                                onClick={() => handleRequestAction(req.id, req.user_id, 'approve')}
                                disabled={isUpdating}
                                style={{
                                  padding: '6px 12px', borderRadius: 6,
                                  border: 'none', cursor: isUpdating ? 'default' : 'pointer',
                                  background: 'var(--color-success-bg, #0f2a1a)',
                                  color: 'var(--color-success, #4ade80)',
                                  fontSize: 12, fontWeight: 500,
                                  display: 'flex', alignItems: 'center', gap: 4,
                                  opacity: isUpdating ? 0.6 : 1,
                                }}
                              >
                                <Check size={12} /> Approve
                              </button>
                              <button
                                onClick={() => handleRequestAction(req.id, req.user_id, 'deny')}
                                disabled={isUpdating}
                                style={{
                                  padding: '6px 12px', borderRadius: 6,
                                  border: '1px solid var(--color-border)',
                                  cursor: isUpdating ? 'default' : 'pointer',
                                  background: 'transparent',
                                  color: 'var(--color-text-dim)',
                                  fontSize: 12, fontWeight: 500,
                                  display: 'flex', alignItems: 'center', gap: 4,
                                  opacity: isUpdating ? 0.6 : 1,
                                }}
                              >
                                <X size={12} /> Deny
                              </button>
                            </div>
                          ) : (
                            <span style={{ fontSize: 12, color: 'var(--color-text-dim)' }}>
                              {req.status === 'approved' ? 'Approved' : 'Denied'}
                            </span>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}
    </div>
  )
}

'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { getAllUsers, updateUserRole } from '@/services/admin'
import type { AdminUser } from '@/services/admin'
import { Spinner } from '@/components/ui/Spinner'
import { Search } from 'lucide-react'

const roleColors: Record<string, { bg: string; text: string }> = {
  admin: { bg: 'var(--color-accent-bg)', text: 'var(--color-accent)' },
  member: { bg: 'var(--color-info-bg)', text: 'var(--color-info)' },
  viewer: { bg: 'var(--color-surface-2)', text: 'var(--color-text-dim)' },
}

export default function UsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [updating, setUpdating] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const supabase = createClient()
      const data = await getAllUsers(supabase)
      setUsers(data)
    } catch {
      // fail silently
    } finally {
      setLoading(false)
    }
  }, [])

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { load() }, [load])

  async function handleRoleChange(userId: string, newRole: 'admin' | 'member' | 'viewer') {
    setUpdating(userId)
    try {
      const supabase = createClient()
      await updateUserRole(supabase, userId, newRole)
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u))
    } catch {
      // fail silently
    } finally {
      setUpdating(null)
    }
  }

  const filtered = users.filter(u =>
    !search || u.username?.toLowerCase().includes(search.toLowerCase()) || u.id.includes(search)
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
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <p style={{ fontSize: 14, color: 'var(--color-text-muted)' }}>
          {users.length} user{users.length !== 1 ? 's' : ''} registered
        </p>
        <div style={{ position: 'relative' }}>
          <Search size={14} color="var(--color-text-dim)" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)' }} />
          <input type="text" placeholder="Search users..." value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              padding: '8px 12px 8px 30px', borderRadius: 8,
              border: '1px solid var(--color-border)',
              background: 'var(--color-surface)',
              fontSize: 13, color: 'var(--color-text)',
              outline: 'none', width: 220,
              transition: 'border-color 0.15s',
            }}
            onFocus={e => e.target.style.borderColor = 'var(--color-accent)'}
            onBlur={e => e.target.style.borderColor = 'var(--color-border)'}
          />
        </div>
      </div>

      {/* Users table */}
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
              <th style={{ textAlign: 'left', padding: '12px 16px', fontWeight: 500, color: 'var(--color-text-dim)', fontSize: 11.5 }}>Joined</th>
              <th style={{ textAlign: 'right', padding: '12px 16px', fontWeight: 500, color: 'var(--color-text-dim)', fontSize: 11.5 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((user) => {
              const roleColor = roleColors[user.role] || roleColors.viewer
              return (
                <tr key={user.id} style={{
                  borderBottom: '1px solid var(--color-border-light)',
                  opacity: updating === user.id ? 0.5 : 1,
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
                      background: roleColor.bg, color: roleColor.text,
                      fontSize: 11, fontWeight: 600, textTransform: 'capitalize',
                    }}>
                      {user.role}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px', color: 'var(--color-text-muted)' }}>
                    {user.project_count}
                  </td>
                  <td style={{ padding: '12px 16px', color: 'var(--color-text-dim)', fontSize: 12 }}>
                    {new Date(user.created_at).toLocaleDateString()}
                  </td>
                  <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                    <select
                      value={user.role}
                      onChange={e => handleRoleChange(user.id, e.target.value as 'admin' | 'member' | 'viewer')}
                      disabled={updating === user.id}
                      style={{
                        padding: '5px 10px', borderRadius: 6,
                        border: '1px solid var(--color-border)',
                        background: 'var(--color-surface-2)',
                        fontSize: 12, color: 'var(--color-text)',
                        outline: 'none', cursor: 'pointer',
                      }}
                    >
                      <option value="admin">Admin</option>
                      <option value="member">Member</option>
                      <option value="viewer">Viewer</option>
                    </select>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

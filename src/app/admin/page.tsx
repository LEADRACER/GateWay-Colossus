'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { getAdminStats } from '@/services/admin'
import type { AdminStats } from '@/services/admin'
import { Spinner } from '@/components/ui/Spinner'
import { FolderOpen, Users, Heart, MessageSquare, TrendingUp, Shield, Layers, Clock } from 'lucide-react'

const statCards = [
  { key: 'totalProjects', label: 'Total Projects', icon: FolderOpen, color: 'var(--color-accent)' },
  { key: 'activeProjects', label: 'Active', icon: TrendingUp, color: 'var(--color-info)' },
  { key: 'pendingProjects', label: 'Pending Review', icon: Clock, color: 'var(--color-warning)' },
  { key: 'totalUsers', label: 'Users', icon: Users, color: 'var(--color-text-dim)' },
  { key: 'totalLikes', label: 'Likes', icon: Heart, color: 'var(--color-danger)' },
  { key: 'totalComments', label: 'Comments', icon: MessageSquare, color: 'var(--color-info)' },
  { key: 'totalCategories', label: 'Categories', icon: Layers, color: 'var(--color-warning)' },
]

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()
    getAdminStats(supabase)
      .then(setStats)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex justify-center items-center py-24">
        <Spinner size="lg" />
      </div>
    )
  }

  return (
    <div className="animate-fade-in">
      {/* Stats grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12, marginBottom: 24 }}>
        {statCards.map((card) => {
          const val = stats ? stats[card.key as keyof AdminStats] : 0
          return (
            <div key={card.key} style={{
              background: 'var(--color-surface)',
              borderRadius: 12,
              border: '1px solid var(--color-border)',
              padding: '16px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <div style={{
                  width: 32, height: 32, borderRadius: 8,
                  background: 'var(--color-surface-2)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <card.icon size={15} color={card.color} strokeWidth={1.8} />
                </div>
                <span style={{ fontSize: 12, color: 'var(--color-text-muted)', fontWeight: 500 }}>{card.label}</span>
              </div>
              <span style={{ fontSize: 24, fontWeight: 600, color: 'var(--color-text)' }}>
                {val?.toLocaleString() ?? 0}
              </span>
            </div>
          )
        })}
      </div>

      {/* Quick actions */}
      <div style={{
        background: 'var(--color-surface)',
        borderRadius: 12,
        border: '1px solid var(--color-border)',
        padding: 20,
      }}>
        <h2 style={{ fontSize: 16, fontWeight: 600, color: 'var(--color-text)', marginBottom: 16 }}>
          Quick Actions
        </h2>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <a href="/admin/moderation" style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '10px 16px', borderRadius: 8,
            background: 'var(--color-accent-bg)',
            color: 'var(--color-accent)',
            fontSize: 13, fontWeight: 500,
            textDecoration: 'none',
            border: '1px solid var(--color-accent)/20',
          }}>
            <Shield size={14} />
            Review Pending Projects
          </a>
          <a href="/admin/users" style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '10px 16px', borderRadius: 8,
            background: 'var(--color-surface-2)',
            color: 'var(--color-text-muted)',
            fontSize: 13, fontWeight: 500,
            textDecoration: 'none',
            border: '1px solid var(--color-border)',
          }}>
            <Users size={14} />
            Manage Users
          </a>
          <a href="/admin/categories" style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '10px 16px', borderRadius: 8,
            background: 'var(--color-surface-2)',
            color: 'var(--color-text-muted)',
            fontSize: 13, fontWeight: 500,
            textDecoration: 'none',
            border: '1px solid var(--color-border)',
          }}>
            <Layers size={14} />
            Edit Categories
          </a>
        </div>
      </div>
    </div>
  )
}

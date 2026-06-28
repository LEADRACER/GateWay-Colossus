'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { getCategories } from '@/services/discovery'
import type { Category } from '@/lib/types/database'
import { Spinner } from '@/components/ui/Spinner'
import { Plus, Edit2, Trash2, FolderOpen } from 'lucide-react'

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const supabase = createClient()
      const data = await getCategories(supabase)
      setCategories(data)
    } catch {
      // fail silently
    } finally {
      setLoading(false)
    }
  }, [])

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { load() }, [load])

  if (loading) {
    return (
      <div className="flex justify-center items-center py-24">
        <Spinner size="lg" />
      </div>
    )
  }

  return (
    <div className="animate-fade-in">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <p style={{ fontSize: 14, color: 'var(--color-text-muted)' }}>
          {categories.length} categor{categories.length !== 1 ? 'ies' : 'y'} configured
        </p>
        <button style={{
          padding: '8px 14px', borderRadius: 8,
          background: 'var(--color-accent)',
          color: '#fff',
          border: 'none', cursor: 'pointer',
          fontSize: 13, fontWeight: 500,
          display: 'flex', alignItems: 'center', gap: 6,
        }}>
          <Plus size={14} />
          Add Category
        </button>
      </div>

      <div style={{ display: 'grid', gap: 8 }}>
        {categories.map((cat) => (
          <div key={cat.id} style={{
            background: 'var(--color-surface)',
            borderRadius: 10,
            border: '1px solid var(--color-border)',
            padding: '14px 16px',
            display: 'flex', alignItems: 'center', gap: 12,
          }}>
            <div style={{
              width: 36, height: 36, borderRadius: 8,
              background: 'var(--color-surface-2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <FolderOpen size={16} color="var(--color-text-dim)" />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 500, fontSize: 14, color: 'var(--color-text)' }}>{cat.name}</div>
              <div style={{ fontSize: 12, color: 'var(--color-text-dim)' }}>/{cat.slug}</div>
            </div>
            {cat.description && (
              <span style={{ fontSize: 12, color: 'var(--color-text-muted)', maxWidth: 200 }}>
                {cat.description}
              </span>
            )}
            <span style={{
              padding: '2px 8px', borderRadius: 10,
              background: 'var(--color-surface-2)',
              fontSize: 11, color: 'var(--color-text-dim)',
            }}>
              #{cat.sort_order}
            </span>
            <div style={{ display: 'flex', gap: 4 }}>
              <button style={{
                padding: 6, borderRadius: 6,
                background: 'var(--color-surface-2)',
                border: '1px solid var(--color-border)',
                cursor: 'pointer', color: 'var(--color-text-muted)',
                display: 'flex',
              }}>
                <Edit2 size={13} />
              </button>
              <button style={{
                padding: 6, borderRadius: 6,
                background: 'var(--color-surface-2)',
                border: '1px solid var(--color-border)',
                cursor: 'pointer', color: 'var(--color-danger)',
                display: 'flex',
              }}>
                <Trash2 size={13} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

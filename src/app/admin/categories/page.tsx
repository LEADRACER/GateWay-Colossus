'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { getCategories } from '@/services/discovery'
import type { Category } from '@/lib/types/database'
import { Spinner } from '@/components/ui/Spinner'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Plus, Edit2, Trash2, FolderOpen } from 'lucide-react'

function slugify(name: string) {
  return name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}

interface Draft {
  id?: string
  name: string
  slug: string
  description: string
  sort_order: number
}

const EMPTY: Draft = { name: '', slug: '', description: '', sort_order: 100 }

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [draft, setDraft] = useState<Draft>(EMPTY)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

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

  async function save() {
    if (!draft.name || !draft.slug) return
    setSaving(true)
    setError(null)
    const supabase = createClient()
    try {
      const payload = {
        name: draft.name,
        slug: slugify(draft.slug),
        description: draft.description || null,
        sort_order: Number.isFinite(draft.sort_order) ? draft.sort_order : 100,
      }
      if (draft.id) {
        const { error: e } = await supabase.from('categories').update(payload).eq('id', draft.id)
        if (e) throw new Error(e.message)
      } else {
        const { error: e } = await supabase.from('categories').insert(payload)
        if (e) throw new Error(e.message)
      }
      setModalOpen(false)
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save category')
    } finally {
      setSaving(false)
    }
  }

  async function remove(cat: Category) {
    if (!window.confirm(`Delete category "${cat.name}"? Links to projects will be removed too.`)) return
    const supabase = createClient()
    setError(null)
    const { error: e } = await supabase.from('categories').delete().eq('id', cat.id)
    if (e) {
      setError(e.message)
      return
    }
    await load()
  }

  function openNew() {
    setDraft(EMPTY)
    setModalOpen(true)
  }

  function openEdit(cat: Category) {
    setDraft({ id: cat.id, name: cat.name, slug: cat.slug, description: cat.description || '', sort_order: cat.sort_order ?? 100 })
    setModalOpen(true)
  }

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
        <Button size="sm" onClick={openNew}>
          <Plus size={14} />
          Add Category
        </Button>
      </div>

      {error && (
        <p style={{ fontSize: 12, color: 'var(--color-danger)', marginBottom: 12 }}>{error}</p>
      )}

      {categories.length === 0 ? (
        <p style={{ fontSize: 13, color: 'var(--color-text-dim)', textAlign: 'center', padding: '40px 0' }}>
          No categories yet — add one to start organizing projects.
        </p>
      ) : (
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
                <button
                  aria-label={`edit ${cat.name}`}
                  onClick={() => openEdit(cat)}
                  style={{
                    padding: 6, borderRadius: 6,
                    background: 'var(--color-surface-2)',
                    border: '1px solid var(--color-border)',
                    cursor: 'pointer', color: 'var(--color-text-muted)',
                    display: 'flex',
                  }}
                >
                  <Edit2 size={13} />
                </button>
                <button
                  aria-label={`delete ${cat.name}`}
                  onClick={() => remove(cat)}
                  style={{
                    padding: 6, borderRadius: 6,
                    background: 'var(--color-surface-2)',
                    border: '1px solid var(--color-border)',
                    cursor: 'pointer', color: 'var(--color-danger)',
                    display: 'flex',
                  }}
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={draft.id ? 'Edit Category' : 'Add Category'}>
        <div style={{ display: 'grid', gap: 12 }}>
          <Input
            placeholder="name"
            value={draft.name}
            onChange={e => setDraft({ ...draft, name: e.target.value, slug: draft.id ? draft.slug : slugify(e.target.value) })}
          />
          <Input
            placeholder="slug"
            value={draft.slug}
            onChange={e => setDraft({ ...draft, slug: e.target.value })}
            disabled={Boolean(draft.id)}
          />
          <Input
            placeholder="description (optional)"
            value={draft.description}
            onChange={e => setDraft({ ...draft, description: e.target.value })}
          />
          <Input
            type="number"
            placeholder="sort order"
            value={String(draft.sort_order)}
            onChange={e => setDraft({ ...draft, sort_order: parseInt(e.target.value, 10) })}
          />
          {error && <p style={{ fontSize: 12, color: 'var(--color-danger)' }}>{error}</p>}
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button onClick={save} disabled={saving || !draft.name || !draft.slug}>
              {saving ? 'Saving…' : 'Save'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { listAPIKeys, createAPIKey, deleteAPIKey } from '@/services/integrations'
import type { APIKey } from '@/services/integrations'
import { Spinner } from '@/components/ui/Spinner'
import { Key, Plus, Trash2, Copy, Check } from 'lucide-react'

export default function APIKeysPage() {
  const [keys, setKeys] = useState<APIKey[]>([])
  const [loading, setLoading] = useState(true)
  const [newKeyName, setNewKeyName] = useState('')
  const [createdKey, setCreatedKey] = useState<{ rawKey: string; name: string } | null>(null)
  const [copied, setCopied] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const supabase = createClient()
      const data = await listAPIKeys(supabase)
      setKeys(data)
    } catch {
      // fail silently
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  async function handleCreate() {
    if (!newKeyName.trim()) return
    try {
      const supabase = createClient()
      const result = await createAPIKey(supabase, newKeyName.trim())
      setCreatedKey({ rawKey: result.rawKey, name: result.key.name })
      setNewKeyName('')
      await load()
    } catch {
      // fail silently
    }
  }

  async function handleDelete(keyId: string) {
    try {
      const supabase = createClient()
      await deleteAPIKey(supabase, keyId)
      await load()
    } catch {
      // fail silently
    }
  }

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-24">
        <Spinner size="lg" />
      </div>
    )
  }

  return (
    <div className="animate-fade-in" style={{ maxWidth: 700 }}>
      {/* Created key modal */}
      {createdKey && (
        <div style={{
          padding: 16, borderRadius: 12,
          background: 'var(--color-accent-bg)',
          border: '1px solid var(--color-accent)/30',
          marginBottom: 20,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <Key size={16} color="var(--color-accent)" />
            <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-accent)' }}>
              API Key Created: {createdKey.name}
            </span>
          </div>
          <div style={{
            padding: '8px 12px', borderRadius: 8,
            background: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            display: 'flex', alignItems: 'center', gap: 8,
            fontFamily: 'monospace', fontSize: 12.5,
          }}>
            <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {createdKey.rawKey}
            </span>
            <button onClick={() => copyToClipboard(createdKey.rawKey)} style={{
              padding: 4, borderRadius: 4,
              background: 'var(--color-surface-2)',
              border: '1px solid var(--color-border)',
              cursor: 'pointer', color: 'var(--color-text-muted)',
              display: 'flex',
            }}>
              {copied ? <Check size={14} /> : <Copy size={14} />}
            </button>
          </div>
          <p style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 8 }}>
            Copy this key now — it won't be shown again.
          </p>
          <button onClick={() => setCreatedKey(null)} style={{
            marginTop: 8, padding: '6px 12px', borderRadius: 6,
            background: 'var(--color-accent)',
            color: '#fff', border: 'none', cursor: 'pointer',
            fontSize: 12, fontWeight: 500,
          }}>
            Dismiss
          </button>
        </div>
      )}

      {/* Create new */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        <input
          type="text"
          placeholder="Key name (e.g. Production Bot)"
          value={newKeyName}
          onChange={e => setNewKeyName(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') handleCreate() }}
          style={{
            flex: 1, padding: '8px 12px', borderRadius: 8,
            border: '1px solid var(--color-border)',
            background: 'var(--color-surface)',
            fontSize: 13, color: 'var(--color-text)',
            outline: 'none',
          }}
        />
        <button onClick={handleCreate} disabled={!newKeyName.trim()} style={{
          padding: '8px 14px', borderRadius: 8,
          background: newKeyName.trim() ? 'var(--color-accent)' : 'var(--color-border)',
          color: '#fff',
          border: 'none', cursor: newKeyName.trim() ? 'pointer' : 'not-allowed',
          fontSize: 13, fontWeight: 500,
          display: 'flex', alignItems: 'center', gap: 6,
        }}>
          <Plus size={14} />
          Create Key
        </button>
      </div>

      {/* Keys list */}
      {keys.length === 0 ? (
        <div style={{
          padding: 40, textAlign: 'center',
          background: 'var(--color-surface)',
          borderRadius: 12, border: '1px solid var(--color-border)',
        }}>
          <Key size={32} color="var(--color-text-dim)" style={{ margin: '0 auto 12', opacity: 0.3 }} />
          <p style={{ fontSize: 14, color: 'var(--color-text-muted)' }}>
            No API keys yet. Create one to get started.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {keys.map((key) => (
            <div key={key.id} style={{
              padding: '12px 16px', borderRadius: 10,
              background: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              display: 'flex', alignItems: 'center', gap: 12,
            }}>
              <div style={{
                width: 32, height: 32, borderRadius: 8,
                background: 'var(--color-accent-bg)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Key size={15} color="var(--color-accent)" />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-text)' }}>{key.name}</div>
                <div style={{ fontSize: 11, color: 'var(--color-text-dim)', fontFamily: 'monospace' }}>
                  {key.key_prefix}... · {key.scopes.join(', ')} · {key.rate_limit}/hr
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{
                  padding: '2px 8px', borderRadius: 10,
                  background: key.is_active ? 'var(--color-accent-bg)' : 'var(--color-surface-2)',
                  color: key.is_active ? 'var(--color-accent)' : 'var(--color-text-dim)',
                  fontSize: 11, fontWeight: 500,
                }}>
                  {key.is_active ? 'Active' : 'Revoked'}
                </span>
                <button onClick={() => handleDelete(key.id)} style={{
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
      )}
    </div>
  )
}

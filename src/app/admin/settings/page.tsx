'use client'

import { useState, useEffect } from 'react'
import { Save, Globe, Shield, Bell } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

// One row per setting in site_settings (key TEXT PK, value JSONB)
interface FormState {
  site_name: string
  tagline: string
  require_project_approval: boolean
  auto_refresh_github: boolean
  allow_anonymous_browsing: boolean
  email_new_project: boolean
  email_new_comment: boolean
}

const DEFAULTS: FormState = {
  site_name: 'GateWay:Colossus',
  tagline: 'Community Project Showcase',
  require_project_approval: true,
  auto_refresh_github: true,
  allow_anonymous_browsing: false,
  email_new_project: true,
  email_new_comment: true,
}

const SETTING_KEYS = Object.keys(DEFAULTS)

export default function SettingsPage() {
  const [saved, setSaved] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState<FormState>(DEFAULTS)

  async function load() {
    setError(null)
    const supabase = createClient()
    const { data, error: e } = await supabase
      .from('site_settings')
      .select('key, value')
    if (e) {
      setError(e.message)
      return
    }
    setForm(prev => {
      const next = { ...prev }
      for (const row of data || []) {
        if ((SETTING_KEYS as string[]).includes(row.key) && row.value !== null && row.value !== undefined) {
          (next as unknown as Record<string, unknown>)[row.key] = row.value
        }
      }
      return next
    })
  }

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { load() }, [])

  async function handleSave() {
    setSaving(true)
    setError(null)
    const supabase = createClient()
    const rows = SETTING_KEYS.map(key => ({ key, value: (form as unknown as Record<string, unknown>)[key] }))
    const { error: e } = await supabase
      .from('site_settings')
      .upsert(rows, { onConflict: 'key' })
    setSaving(false)
    if (e) {
      setError(e.message)
      return
    }
    setSaved(true)
    // persisted indicator
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="animate-fade-in" style={{ maxWidth: 640 }}>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 16, fontWeight: 600, color: 'var(--color-text)', marginBottom: 4 }}>
          Platform Settings
        </h2>
        <p style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>
          Configure your Colossus instance
        </p>
      </div>

      {/* General */}
      <div style={{
        background: 'var(--color-surface)',
        borderRadius: 12,
        border: '1px solid var(--color-border)',
        padding: 20,
        marginBottom: 16,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <Globe size={16} color="var(--color-text-dim)" />
          <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text)', margin: 0 }}>General</h3>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div>
            <label style={{ fontSize: 12, color: 'var(--color-text-muted)', display: 'block', marginBottom: 4, fontWeight: 500 }}>
              Site Name
            </label>
            <input type="text" value={form.site_name} onChange={e => setForm({ ...form, site_name: e.target.value })} style={{
              width: '100%', padding: '8px 12px', borderRadius: 8,
              border: '1px solid var(--color-border)',
              background: 'var(--color-surface-2)',
              fontSize: 13, color: 'var(--color-text)',
              outline: 'none',
            }} />
          </div>
          <div>
            <label style={{ fontSize: 12, color: 'var(--color-text-muted)', display: 'block', marginBottom: 4, fontWeight: 500 }}>
              Tagline
            </label>
            <input type="text" value={form.tagline} onChange={e => setForm({ ...form, tagline: e.target.value })} style={{
              width: '100%', padding: '8px 12px', borderRadius: 8,
              border: '1px solid var(--color-border)',
              background: 'var(--color-surface-2)',
              fontSize: 13, color: 'var(--color-text)',
              outline: 'none',
            }} />
          </div>
        </div>
      </div>

      {/* Moderation */}
      <div style={{
        background: 'var(--color-surface)',
        borderRadius: 12,
        border: '1px solid var(--color-border)',
        padding: 20,
        marginBottom: 16,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <Shield size={16} color="var(--color-text-dim)" />
          <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text)', margin: 0 }}>Moderation</h3>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
            <input type="checkbox" checked={form.require_project_approval} onChange={e => setForm({ ...form, require_project_approval: e.target.checked })} style={{ accentColor: 'var(--color-accent)' }} />
            <span style={{ fontSize: 13, color: 'var(--color-text)' }}>Require project approval</span>
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
            <input type="checkbox" checked={form.auto_refresh_github} onChange={e => setForm({ ...form, auto_refresh_github: e.target.checked })} style={{ accentColor: 'var(--color-accent)' }} />
            <span style={{ fontSize: 13, color: 'var(--color-text)' }}>Auto-refresh GitHub data on submission</span>
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
            <input type="checkbox" checked={form.allow_anonymous_browsing} onChange={e => setForm({ ...form, allow_anonymous_browsing: e.target.checked })} style={{ accentColor: 'var(--color-accent)' }} />
            <span style={{ fontSize: 13, color: 'var(--color-text)' }}>Allow anonymous browsing</span>
          </label>
        </div>
      </div>

      {/* Notifications */}
      <div style={{
        background: 'var(--color-surface)',
        borderRadius: 12,
        border: '1px solid var(--color-border)',
        padding: 20,
        marginBottom: 16,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <Bell size={16} color="var(--color-text-dim)" />
          <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text)', margin: 0 }}>Notifications</h3>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
            <input type="checkbox" checked={form.email_new_project} onChange={e => setForm({ ...form, email_new_project: e.target.checked })} style={{ accentColor: 'var(--color-accent)' }} />
            <span style={{ fontSize: 13, color: 'var(--color-text)' }}>Email on new project submission</span>
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
            <input type="checkbox" checked={form.email_new_comment} onChange={e => setForm({ ...form, email_new_comment: e.target.checked })} style={{ accentColor: 'var(--color-accent)' }} />
            <span style={{ fontSize: 13, color: 'var(--color-text)' }}>Email on new comment</span>
          </label>
        </div>
      </div>

      {/* Save */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <button onClick={handleSave} disabled={saving} style={{
          padding: '10px 20px', borderRadius: 8,
          background: 'var(--color-accent)',
          color: '#fff',
          border: 'none', cursor: 'pointer',
          fontSize: 13, fontWeight: 500,
          display: 'flex', alignItems: 'center', gap: 6,
        }}>
          <Save size={14} />
          {saving ? 'Saving…' : 'Save Settings'}
        </button>
        {saved && (
          <span style={{ fontSize: 13, color: 'var(--color-success)', fontWeight: 500 }}>
            ✓ Saved successfully
          </span>
        )}
        {error && <span style={{ fontSize: 13, color: 'var(--color-danger)' }}>{error}</span>}
      </div>
    </div>
  )
}

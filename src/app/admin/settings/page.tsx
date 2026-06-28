'use client'

import { useState } from 'react'
import { Save, Globe, Shield, Bell } from 'lucide-react'

export default function SettingsPage() {
  const [saved, setSaved] = useState(false)

  function handleSave() {
    setSaved(true)
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
            <input type="text" defaultValue="GateWay:Colossus" style={{
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
            <input type="text" defaultValue="Community Project Showcase" style={{
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
            <input type="checkbox" defaultChecked style={{ accentColor: 'var(--color-accent)' }} />
            <span style={{ fontSize: 13, color: 'var(--color-text)' }}>Require project approval</span>
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
            <input type="checkbox" defaultChecked style={{ accentColor: 'var(--color-accent)' }} />
            <span style={{ fontSize: 13, color: 'var(--color-text)' }}>Auto-refresh GitHub data on submission</span>
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
            <input type="checkbox" style={{ accentColor: 'var(--color-accent)' }} />
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
            <input type="checkbox" defaultChecked style={{ accentColor: 'var(--color-accent)' }} />
            <span style={{ fontSize: 13, color: 'var(--color-text)' }}>Email on new project submission</span>
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
            <input type="checkbox" defaultChecked style={{ accentColor: 'var(--color-accent)' }} />
            <span style={{ fontSize: 13, color: 'var(--color-text)' }}>Email on new comment</span>
          </label>
        </div>
      </div>

      {/* Save */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <button onClick={handleSave} style={{
          padding: '10px 20px', borderRadius: 8,
          background: 'var(--color-accent)',
          color: '#fff',
          border: 'none', cursor: 'pointer',
          fontSize: 13, fontWeight: 500,
          display: 'flex', alignItems: 'center', gap: 6,
        }}>
          <Save size={14} />
          Save Settings
        </button>
        {saved && (
          <span style={{ fontSize: 13, color: 'var(--color-accent)', fontWeight: 500 }}>
            ✓ Saved successfully
          </span>
        )}
      </div>
    </div>
  )
}

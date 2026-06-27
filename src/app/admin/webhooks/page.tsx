'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { listWebhooks, createWebhook, deleteWebhook, getWebhookDeliveries } from '@/services/integrations'
import type { Webhook, WebhookDelivery } from '@/services/integrations'
import { Spinner } from '@/components/ui/Spinner'
import { Webhook as WebhookIcon, Plus, Trash2, Check, AlertTriangle, RefreshCw, ChevronDown, ChevronUp, XCircle, Clock } from 'lucide-react'

const eventOptions = [
  'project.liked',
  'project.commented',
  'project.created',
  'project.archived',
  '*',
]

export default function WebhooksPage() {
  const [webhooks, setWebhooks] = useState<Webhook[]>([])
  const [loading, setLoading] = useState(true)
  const [url, setUrl] = useState('')
  const [selectedEvents, setSelectedEvents] = useState<string[]>(['project.liked', 'project.commented'])
  const [createdWebhook, setCreatedWebhook] = useState<{ secret: string; url: string } | null>(null)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [deliveries, setDeliveries] = useState<Record<string, WebhookDelivery[]>>({})
  const [deliveriesLoading, setDeliveriesLoading] = useState<string | null>(null)
  const [retrying, setRetrying] = useState<string | null>(null)
  const [retryMsg, setRetryMsg] = useState<{ id: string; msg: string } | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const supabase = createClient()
      const data = await listWebhooks(supabase)
      setWebhooks(data)
    } catch {
      // fail silently
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  async function loadDeliveries(webhookId: string) {
    setDeliveriesLoading(webhookId)
    try {
      const supabase = createClient()
      const data = await getWebhookDeliveries(supabase, webhookId, 10)
      setDeliveries(prev => ({ ...prev, [webhookId]: data }))
    } catch {
      // fail silently
    } finally {
      setDeliveriesLoading(null)
    }
  }

  function toggleExpand(webhookId: string) {
    if (expanded === webhookId) {
      setExpanded(null)
    } else {
      setExpanded(webhookId)
      if (!deliveries[webhookId]) {
        loadDeliveries(webhookId)
      }
    }
  }

  async function handleCreate() {
    if (!url.trim()) return
    try {
      const supabase = createClient()
      const result = await createWebhook(supabase, url.trim(), selectedEvents)
      setCreatedWebhook({ secret: result.secret, url: result.webhook.url })
      setUrl('')
      await load()
    } catch {
      // fail silently
    }
  }

  async function handleDelete(webhookId: string) {
    try {
      const supabase = createClient()
      await deleteWebhook(supabase, webhookId)
      setDeliveries(prev => { const n = { ...prev }; delete n[webhookId]; return n })
      if (expanded === webhookId) setExpanded(null)
      await load()
    } catch {
      // fail silently
    }
  }

  async function handleRetry(deliveryId: string, webhookId: string) {
    setRetrying(deliveryId)
    setRetryMsg(null)
    try {
      const res = await fetch('/api/webhooks/retry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ delivery_id: deliveryId }),
      })
      const data = await res.json()
      setRetryMsg({
        id: deliveryId,
        msg: data.success ? '✓ Re-sent' : `✗ ${data.error || 'Failed'}`,
      })
      // Refresh deliveries
      loadDeliveries(webhookId)
    } catch {
      setRetryMsg({ id: deliveryId, msg: '✗ Network error' })
    } finally {
      setRetrying(null)
    }
  }

  function toggleEvent(event: string) {
    if (event === '*') {
      setSelectedEvents(['*'])
      return
    }
    setSelectedEvents(prev => {
      const filtered = prev.filter(e => e !== '*')
      if (filtered.includes(event)) {
        return filtered.filter(e => e !== event)
      }
      return [...filtered, event]
    })
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-24">
        <Spinner size="lg" />
      </div>
    )
  }

  return (
    <div className="animate-fade-in" style={{ maxWidth: 760 }}>
      {/* Created webhook modal */}
      {createdWebhook && (
        <div style={{
          padding: 16, borderRadius: 12,
          background: 'var(--color-accent-bg)',
          border: '1px solid var(--color-accent)/30',
          marginBottom: 20,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <WebhookIcon size={16} color="var(--color-accent)" />
            <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-accent)' }}>
              Webhook Created
            </span>
          </div>
          <p style={{ fontSize: 12, color: 'var(--color-text-muted)', marginBottom: 8 }}>
            Your webhook secret is used to verify payloads. Keep it secure:
          </p>
          <div style={{
            padding: '8px 12px', borderRadius: 8,
            background: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            fontFamily: 'monospace', fontSize: 12,
            wordBreak: 'break-all',
          }}>
            {createdWebhook.secret}
          </div>
          <p style={{ fontSize: 11, color: 'var(--color-text-dim)', marginTop: 6 }}>
            Endpoint: {createdWebhook.url}
          </p>
          <button onClick={() => setCreatedWebhook(null)} style={{
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
      <div style={{
        padding: 16, borderRadius: 12,
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        marginBottom: 20,
      }}>
        <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text)', marginBottom: 12 }}>
          Create Webhook
        </h3>
        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          <input
            type="url"
            placeholder="https://your-app.com/webhooks/colossus"
            value={url}
            onChange={e => setUrl(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleCreate() }}
            style={{
              flex: 1, padding: '8px 12px', borderRadius: 8,
              border: '1px solid var(--color-border)',
              background: 'var(--color-surface-2)',
              fontSize: 13, color: 'var(--color-text)',
              outline: 'none',
            }}
          />
          <button onClick={handleCreate} disabled={!url.trim()} style={{
            padding: '8px 14px', borderRadius: 8,
            background: url.trim() ? 'var(--color-accent)' : 'var(--color-border)',
            color: '#fff',
            border: 'none', cursor: url.trim() ? 'pointer' : 'not-allowed',
            fontSize: 13, fontWeight: 500,
            display: 'flex', alignItems: 'center', gap: 6,
          }}>
            <Plus size={14} />
            Create
          </button>
        </div>
        <div>
          <label style={{ fontSize: 11, color: 'var(--color-text-dim)', display: 'block', marginBottom: 6, fontWeight: 500 }}>
            Events
          </label>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {eventOptions.map((event) => {
              const active = selectedEvents.includes(event)
              return (
                <button key={event} onClick={() => toggleEvent(event)} style={{
                  padding: '4px 10px', borderRadius: 6,
                  border: '1px solid ' + (active ? 'var(--color-accent)' : 'var(--color-border)'),
                  background: active ? 'var(--color-accent-bg)' : 'var(--color-surface-2)',
                  color: active ? 'var(--color-accent)' : 'var(--color-text-muted)',
                  cursor: 'pointer', fontSize: 12, fontWeight: 500,
                }}>
                  {event}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Webhooks list */}
      {webhooks.length === 0 ? (
        <div style={{
          padding: 40, textAlign: 'center',
          background: 'var(--color-surface)',
          borderRadius: 12, border: '1px solid var(--color-border)',
        }}>
          <WebhookIcon size={32} color="var(--color-text-dim)" style={{ margin: '0 auto 12', opacity: 0.3 }} />
          <p style={{ fontSize: 14, color: 'var(--color-text-muted)' }}>
            No webhooks configured yet.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {webhooks.map((wh) => {
            const isExpanded = expanded === wh.id
            const whDeliveries = deliveries[wh.id] || []
            return (
              <div key={wh.id} style={{
                borderRadius: 10,
                border: `1px solid ${wh.failure_count > 0 ? 'var(--color-warning)' : 'var(--color-border)'}`,
                overflow: 'hidden',
              }}>
                {/* Webhook header row */}
                <div
                  onClick={() => toggleExpand(wh.id)}
                  style={{
                    padding: '12px 16px',
                    background: 'var(--color-surface)',
                    display: 'flex', alignItems: 'center', gap: 12,
                    cursor: 'pointer',
                    transition: 'background 0.1s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--color-surface-2)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'var(--color-surface)'}
                >
                  <div style={{
                    width: 32, height: 32, borderRadius: 8,
                    background: wh.is_active ? 'var(--color-accent-bg)' : 'var(--color-surface-2)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    <WebhookIcon size={15} color={wh.is_active ? 'var(--color-accent)' : 'var(--color-text-dim)'} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontSize: 13, fontWeight: 500, color: 'var(--color-text)',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>
                      {wh.url}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--color-text-dim)', marginTop: 2 }}>
                      {wh.events.join(', ')}
                      {wh.last_triggered_at && (' · Last: ' + new Date(wh.last_triggered_at).toLocaleString())}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                    {wh.failure_count > 0 && (
                      <span style={{
                        display: 'flex', alignItems: 'center', gap: 4,
                        padding: '2px 8px', borderRadius: 10,
                        background: 'var(--color-warning-bg)',
                        color: 'var(--color-warning)',
                        fontSize: 11, fontWeight: 500,
                      }}>
                        <AlertTriangle size={10} />
                        {wh.failure_count}
                      </span>
                    )}
                    <span style={{
                      padding: '2px 8px', borderRadius: 10,
                      background: wh.is_active ? 'var(--color-accent-bg)' : 'var(--color-surface-2)',
                      color: wh.is_active ? 'var(--color-accent)' : 'var(--color-text-dim)',
                      fontSize: 11, fontWeight: 500,
                    }}>
                      {wh.is_active ? 'Active' : 'Paused'}
                    </span>
                    <button onClick={e => { e.stopPropagation(); handleDelete(wh.id) }} style={{
                      padding: 6, borderRadius: 6,
                      background: 'var(--color-surface-2)',
                      border: '1px solid var(--color-border)',
                      cursor: 'pointer', color: 'var(--color-danger)',
                      display: 'flex',
                    }}>
                      <Trash2 size={13} />
                    </button>
                    {isExpanded ? <ChevronUp size={14} color="var(--color-text-dim)" /> : <ChevronDown size={14} color="var(--color-text-dim)" />}
                  </div>
                </div>

                {/* Expanded delivery logs */}
                {isExpanded && (
                  <div style={{
                    background: 'var(--color-surface-2)',
                    borderTop: '1px solid var(--color-border)',
                    padding: 12,
                  }}>
                    {deliveriesLoading === wh.id ? (
                      <div className="flex justify-center py-4">
                        <Spinner size="sm" />
                      </div>
                    ) : whDeliveries.length === 0 ? (
                      <p style={{ fontSize: 12, color: 'var(--color-text-dim)', textAlign: 'center', padding: '12px 0' }}>
                        No delivery history yet.
                      </p>
                    ) : (
                      <div>
                        <p style={{ fontSize: 11, color: 'var(--color-text-dim)', fontWeight: 600, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                          Recent Deliveries
                        </p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                          {whDeliveries.map((d) => {
                            const isFailed = d.success === false || (d.status_code !== undefined && d.status_code >= 400)
                            const isRetrying = retrying === d.id
                            return (
                              <div key={d.id} style={{
                                padding: '8px 12px', borderRadius: 8,
                                background: 'var(--color-surface)',
                                border: '1px solid var(--color-border)',
                                display: 'flex', alignItems: 'center', gap: 10,
                                fontSize: 12,
                              }}>
                                {/* Status indicator */}
                                <div style={{
                                  width: 8, height: 8, borderRadius: '50%',
                                  background: isFailed ? 'var(--color-danger)' : 'var(--color-success, #4ade80)',
                                  flexShrink: 0,
                                }} />

                                {/* Event */}
                                <span style={{
                                  color: 'var(--color-text)', fontWeight: 500, minWidth: 120, flexShrink: 0,
                                }}>
                                  {d.event}
                                </span>

                                {/* Status code */}
                                <span style={{
                                  padding: '1px 6px', borderRadius: 4,
                                  background: isFailed ? 'var(--color-danger-bg, #2a0f0f)' : 'var(--color-accent-bg)',
                                  color: isFailed ? 'var(--color-danger)' : 'var(--color-accent)',
                                  fontSize: 11, fontWeight: 600, fontFamily: 'monospace',
                                  minWidth: 32, textAlign: 'center',
                                }}>
                                  {d.status_code || '—'}
                                </span>

                                {/* Duration */}
                                {d.duration_ms !== undefined && d.duration_ms !== null && (
                                  <span style={{
                                    color: 'var(--color-text-dim)', fontSize: 11,
                                    display: 'flex', alignItems: 'center', gap: 3,
                                  }}>
                                    <Clock size={11} />
                                    {d.duration_ms}ms
                                  </span>
                                )}

                                {/* Time */}
                                <span style={{ color: 'var(--color-text-dim)', fontSize: 11, marginLeft: 'auto' }}>
                                  {new Date(d.created_at).toLocaleString()}
                                </span>

                                {/* Retry button */}
                                {isFailed && (
                                  <button
                                    onClick={() => handleRetry(d.id, wh.id)}
                                    disabled={isRetrying}
                                    style={{
                                      padding: '4px 8px', borderRadius: 6,
                                      background: 'var(--color-surface-2)',
                                      border: '1px solid var(--color-border)',
                                      cursor: 'pointer',
                                      fontSize: 11, fontWeight: 500,
                                      display: 'flex', alignItems: 'center', gap: 4,
                                      color: isRetrying ? 'var(--color-text-dim)' : 'var(--color-accent)',
                                      opacity: isRetrying ? 0.6 : 1,
                                    }}
                                  >
                                    <RefreshCw size={11} style={{ animation: isRetrying ? 'spin 1s linear infinite' : 'none' }} />
                                    Retry
                                  </button>
                                )}

                                {/* Retry result */}
                                {retryMsg && retryMsg.id === d.id && (
                                  <span style={{
                                    fontSize: 11, fontWeight: 500,
                                    color: retryMsg.msg.startsWith('✓') ? 'var(--color-success)' : 'var(--color-danger)',
                                  }}>
                                    {retryMsg.msg}
                                  </span>
                                )}
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

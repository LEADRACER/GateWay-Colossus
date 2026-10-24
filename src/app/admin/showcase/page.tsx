'use client'
import Link from 'next/link'
import { useCallback, useEffect, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'
import { ErrorMessage } from '@/components/ui/ErrorMessage'

interface ShowcaseRequestRow {
  id: string
  project_id: string
  project_name?: string
  project_owner?: string
  requester_login?: string
  team_name?: string
  status: 'pending' | 'approved' | 'rejected'
  type?: string
  created_at: string
}

type Filter = 'pending' | 'approved' | 'rejected'

export default function AdminShowcasePage() {
  const [requests, setRequests] = useState<ShowcaseRequestRow[]>([])
  const [total, setTotal] = useState(0)
  const [filter, setFilter] = useState<Filter>('pending')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [updating, setUpdating] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const response = await fetch(`/api/admin/showcase-requests?status=${filter}&limit=50`)
      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to load showcase requests')
      }
      const data = await response.json()
      setRequests(data.requests)
      setTotal(data.total)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }, [filter])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load()
  }, [load])

  async function act(id: string, action: 'approve' | 'reject' | 'revoke') {
    setUpdating(id)
    try {
      const response = await fetch(`/api/admin/showcase-requests/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      })
      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to update request')
      }
      await load()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'An error occurred')
    } finally {
      setUpdating(null)
    }
  }

  return (
    <div className="max-w-4xl">
      <h1 className="text-2xl font-bold text-text mb-1">Showcase Requests</h1>
      <p className="text-sm text-text-dim mb-6">
        Approve homepage showcases — approvals become visible on the public board.
      </p>

      <div className="flex gap-2 mb-6">
        {(['pending', 'approved', 'rejected'] as Filter[]).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 h-8 text-xs font-medium border transition-colors cursor-pointer ${
              filter === f
                ? 'border-green text-green-bright bg-green-subtle'
                : 'border-border text-text-muted hover:text-text'
            }`}
          >
            {f} {f === filter ? `(${total})` : ''}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Spinner /></div>
      ) : error ? (
        <ErrorMessage message={error} />
      ) : requests.length === 0 ? (
        <p className="text-sm text-text-dim py-12 text-center">no {filter} requests</p>
      ) : (
        <div className="divide-y divide-border border-y border-border">
          {requests.map(r => (
            <div key={r.id} className="flex items-center justify-between gap-4 py-3.5">
              <div className="min-w-0">
                <p className="text-sm text-text font-medium truncate">
                  <Link href={`/projects/${r.project_id}`}>
                    <span className="hover:text-green-bright">{r.project_name || r.project_id.slice(0, 8)}</span>
                  </Link>
                  <span className="text-text-dim font-normal">
                    {r.project_owner ? ` · ${r.project_owner}` : ''}
                  </span>
                </p>
                <p className="text-xs text-text-dim mt-0.5">
                  {r.type || 'homepage'} · by {r.requester_login || 'unknown'}
                  {r.team_name ? ` · team ${r.team_name}` : ''} · {new Date(r.created_at).toLocaleDateString()}
                </p>
              </div>
              <div className="flex gap-2 shrink-0">
                {r.status === 'pending' ? (
                  <>
                    <Button size="sm" onClick={() => act(r.id, 'approve')} loading={updating === r.id}>
                      Approve
                    </Button>
                    <Button size="sm" variant="secondary" onClick={() => act(r.id, 'reject')} loading={updating === r.id}>
                      Reject
                    </Button>
                  </>
                ) : r.status === 'approved' ? (
                  <Button size="sm" variant="secondary" onClick={() => act(r.id, 'revoke')} loading={updating === r.id}>
                    Revoke
                  </Button>
                ) : (
                  <span className="text-xs text-text-dim px-3 h-8 flex items-center">{r.status}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

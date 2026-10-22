'use client'

import { useEffect } from 'react'
import { pushTerminalEvent, EVENT_COLORS } from '@/components/features/terminal/events'
import { C } from '@/lib/terminal/palette'

interface ActivityRow {
  action: string
  metadata: Record<string, unknown> | null
}

function describeActivity(row: ActivityRow): string {
  const meta = row.metadata ?? {}
  const project = typeof meta.project_name === 'string' ? meta.project_name : null
  const user = typeof meta.username === 'string' ? meta.username : null
  switch (row.action) {
    case 'project_created':
      return `${user ?? 'someone'} shipped ${project ?? 'a project'}`
    case 'project_liked':
      return `${user ?? 'someone'} starred ${project ?? 'a project'}`
    case 'project_bookmarked':
      return `${user ?? 'someone'} bookmarked ${project ?? 'a project'}`
    case 'comment_added':
      return `${user ?? 'someone'} commented on ${project ?? 'a project'}`
    case 'project_submitted':
      return `${project ?? 'a project'} submitted for showcase`
    case 'project_approved':
      return `${project ?? 'a project'} entered the FIRED list`
    case 'project_rejected':
      return `${project ?? 'a project'} was turned down`
    default:
      return row.action.replace(/_/g, ' ')
  }
}

let seeded = false

function seedDemoEvents(): void {
  if (seeded) return
  seeded = true
  pushTerminalEvent('system', 'feed channel established', C.FG_MUTED)
  if (!new URLSearchParams(window.location.search).has('demo')) return
  const demos: Array<[Parameters<typeof pushTerminalEvent>[0], string]> = [
    ['project', 'spinach/starlight shipped graphql-turbo'],
    ['like', 'akhil starred colossus-cli'],
    ['comment', 'revati left a note on neon-gateway'],
    ['bookmark', 'dave pinned photon-engine'],
    ['join', 'team NIGHT-OWL docked a new member'],
    ['project', 'colossus-cli entered the FIRED list'],
  ]
  demos.forEach(([kind, text], i) =>
    setTimeout(() => pushTerminalEvent(kind, text, EVENT_COLORS[kind]), 400 + i * 260)
  )
}

export function useTerminalEvents(): void {
  useEffect(() => {
    seedDemoEvents()

    let supabase: import('@supabase/supabase-js').SupabaseClient | null = null
    let disposed = false
    let channel: ReturnType<import('@supabase/supabase-js').SupabaseClient['channel']> | null = null

    import('@/lib/supabase/client')
      .then((m) => {
        if (disposed) return
        supabase = m.createClient()
        channel = supabase
          .channel('gateway-terminal')
          .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'activities' }, (payload) => {
            const row = payload.new as ActivityRow
            const kind = row.action.startsWith('project_liked')
              ? 'like'
              : row.action === 'comment_added'
                ? 'comment'
                : row.action === 'project_bookmarked'
                  ? 'bookmark'
                  : 'project'
            pushTerminalEvent(kind, describeActivity(row), EVENT_COLORS[kind])
          })
          .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'likes' }, () => {
            pushTerminalEvent('like', 'a star flickered on', EVENT_COLORS.like)
          })
          .subscribe()
      })
      .catch(() => {
        pushTerminalEvent('system', 'feed channel offline — running on cache', C.FG_MUTED)
      })

    return () => {
      disposed = true
      if (supabase && channel) supabase.removeChannel(channel)
    }
  }, [])
}

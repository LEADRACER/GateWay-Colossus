import type { ColorIndex } from '@/lib/terminal/palette'
import { C } from '@/lib/terminal/palette'

export type TerminalEventKind = 'like' | 'comment' | 'bookmark' | 'project' | 'join' | 'system'

export interface TerminalEvent {
  id: string
  kind: TerminalEventKind
  text: string
  color: ColorIndex
  at: number
}

export interface TerminalEventSeed {
  id: string
  kind: TerminalEventKind
  text: string
  at: number | string
}

const MAX_EVENTS = 60

const ring: TerminalEvent[] = []
let nextId = 1
const seenIds = new Set<string>()
const listeners = new Set<() => void>()

function notify(): void {
  for (const fn of listeners) fn()
}

function append(event: TerminalEvent): void {
  ring.push(event)
  if (ring.length > MAX_EVENTS) ring.splice(0, ring.length - MAX_EVENTS)
  snapshot = [...ring]
}

let snapshot: TerminalEvent[] = []

export function pushTerminalEvent(kind: TerminalEventKind, text: string, color: ColorIndex): void {
  const id = `syn-${nextId++}`
  seenIds.add(id)
  append({ id, kind, text, color, at: Date.now() })
  notify()
}

export function hydrateTerminalEvents(seeds: TerminalEventSeed[]): void {
  let changed = false
  for (const seed of seeds) {
    if (seenIds.has(seed.id)) continue
    seenIds.add(seed.id)
    const id = typeof seed.id === 'number' ? `srv-${seed.id}` : seed.id
    append({
      id,
      kind: seed.kind,
      text: seed.text,
      color: EVENT_COLORS[seed.kind] ?? C.FG_MUTED,
      at: typeof seed.at === 'number' ? seed.at : new Date(seed.at).getTime() || Date.now(),
    })
    changed = true
  }
  if (changed) notify()
}

export function getTerminalEvents(): TerminalEvent[] {
  return ring
}

export function getEventsSnapshot(): TerminalEvent[] {
  return snapshot
}

export function getEventsCount(): number {
  return snapshot.length
}

export function subscribeEventsStore(fn: () => void): () => void {
  listeners.add(fn)
  return () => {
    listeners.delete(fn)
  }
}

export function subscribeTerminalEvents(fn: () => void): () => void {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

export const EVENT_COLORS: Record<TerminalEventKind, ColorIndex> = {
  like: C.AMBER,
  comment: C.CYAN,
  bookmark: C.MAGENTA,
  project: C.GREEN_BRIGHT,
  join: C.BLUE,
  system: C.FG_MUTED,
}

export const EVENT_ICONS: Record<TerminalEventKind, string> = {
  like: '♥',
  comment: '◆',
  bookmark: '⚑',
  project: '▸',
  join: '⌁',
  system: '·',
}

export function formatEventLine(e: TerminalEvent, now: number): string {
  const secs = Math.max(0, Math.floor((now - e.at) / 1000))
  const age = secs < 60 ? `${secs}s` : `${Math.floor(secs / 60)}m`
  return `${EVENT_ICONS[e.kind]} ${e.text} · ${age}`
}

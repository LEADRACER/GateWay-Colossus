export type SceneName = 'boot' | 'rain' | 'constellation' | 'ticker'

export const CYCLE_SCENES: SceneName[] = ['rain', 'constellation', 'ticker']

let requested: string | null = null
let active: string = 'boot'
const requestListeners = new Set<(name: string) => void>()
const activeListeners = new Set<(name: string) => void>()

function notifyRequest(): void {
  for (const fn of requestListeners) fn(requested!)
}

function notifyActive(): void {
  for (const fn of activeListeners) fn(active)
}

export function requestScene(name: string): void {
  requested = name
  notifyRequest()
}

export function getRequestedScene(): string | null {
  return requested
}

export function setActiveScene(name: string): void {
  if (active !== name) {
    active = name
    notifyActive()
  }
}

export function getActiveScene(): string {
  return active
}

export function subscribeRequestedScene(fn: (name: string) => void): () => void {
  requestListeners.add(fn)
  if (requested) fn(requested)
  return () => requestListeners.delete(fn)
}

export function subscribeActiveScene(fn: (name: string) => void): () => void {
  activeListeners.add(fn)
  fn(active)
  return () => activeListeners.delete(fn)
}

export function syncUrlScene(name: string): void {
  if (typeof window === 'undefined') return
  const params = new URLSearchParams(window.location.search)
  if (params.get('scene') !== name) {
    params.set('scene', name)
    window.history.replaceState(null, '', `?${params.toString()}`)
  }
}

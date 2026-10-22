import type { CellBuffer } from '@/lib/terminal/CellBuffer'

export interface TerminalFeedTeam {
  id: string
  code: string
  name: string
  position: [number, number, number]
  memberCount: number
  projectCount: number
  isShowcased: boolean
  color: string
}

export interface TerminalFeedProject {
  id: string
  teamId: string | null
  name: string
  stars: number
  language: string | null
  isShowcased: boolean
}

export interface TerminalFeedEdge {
  source: string
  target: string
  weight: number
}

export interface TerminalFeedEvent {
  id: string
  kind: 'like' | 'comment' | 'bookmark' | 'project' | 'join' | 'system'
  text: string
  at: number | string
}

export interface TerminalFeed {
  teams: TerminalFeedTeam[]
  projects: TerminalFeedProject[]
  edges: TerminalFeedEdge[]
  events?: TerminalFeedEvent[]
  metadata: {
    totalTeams: number
    totalProjects: number
    totalStars: number
    lastUpdated: string
  }
}

export interface TerminalPointer {
  col: number
  row: number
  present: boolean
}

export interface TerminalSceneCtx {
  buffer: CellBuffer
  feed: TerminalFeed | null
  time: number
  dt: number
  pointer: TerminalPointer
  reducedMotion: boolean
  requestSwitch: (name: string) => void
}

export interface TerminalScene {
  name: string
  reset(ctx: TerminalSceneCtx): void
  update(ctx: TerminalSceneCtx): void
  destroy?(): void
}

export const glyphs = {
  cursor: '▊',
  block: '█',
  node: '◉',
  orbit: '◦',
  star: '★',
  heart: '♥',
  speech: '◆',
  bolt: '»',
}

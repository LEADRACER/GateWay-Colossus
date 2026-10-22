import useSWR from 'swr'
import type { TerminalFeed } from '@/components/features/terminal/types'

const fetcher = (url: string): Promise<TerminalFeed> => fetch(url).then((res) => res.json())

const LANGS = ['TypeScript', 'Rust', 'Go', 'Python', 'C++', 'Svelte']
const NAMES = [
  'Photon Engine', 'Night Owl', 'Patchwork', 'Void Sailors', 'Terminal Velocity',
  'Kernel Panic', 'Byte Forge', 'Lumen Collective', 'Ghost Protocol', 'Static Charge',
]
const PROJECTS = [
  'graphql-turbo', 'colossus-cli', 'neon-gateway', 'photon-core', 'rainbow-vm',
  'screaming-deadbeef', 'tty-art', 'kernel-kombat', 'fiber-optic', 'hex-dump',
]

function demoFeed(): TerminalFeed {
  const teams = NAMES.map((name, i) => ({
    id: `t${i}`,
    code: `T${i}DEMO`.slice(0, 6),
    name,
    position: [
      0.5 + Math.cos((i / NAMES.length) * Math.PI * 2) * (0.28 + (i % 3) * 0.09),
      0.5 + Math.sin((i / NAMES.length) * Math.PI * 2) * (0.24 + (i % 4) * 0.07),
      0,
    ] as [number, number, number],
    memberCount: (i * 7) % 24 + 3,
    projectCount: (i * 3) % 9,
    isShowcased: i === 1 || i === 6,
    color: '#5dff85',
  }))
  const projects = PROJECTS.map((name, i) => ({
    id: `p${i}`,
    teamId: teams[i % teams.length].id,
    name,
    stars: (i * 137) % 400,
    language: LANGS[i % LANGS.length],
    isShowcased: i % 4 === 0,
  }))
  return {
    teams,
    projects,
    edges: teams.slice(0, -1).flatMap((t, i) => [
      { source: t.code, target: teams[(i + 1) % teams.length].code, weight: 0.3 + (i % 5) * 0.14 },
      { source: t.code, target: teams[(i + 3) % teams.length].code, weight: 0.2 },
    ]),
    metadata: {
      totalTeams: teams.length,
      totalProjects: projects.length,
      totalStars: 27500,
      lastUpdated: new Date().toISOString(),
    },
  }
}

export function useTerminalFeed(): { feed: TerminalFeed | null; isLoading: boolean; error: unknown } {
  const { data, error, isLoading } = useSWR<TerminalFeed>('/api/feed/live', fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 60000,
    refreshInterval: 0,
  })
  const wantDemo = typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('demo')
  return { feed: wantDemo ? demoFeed() : data ?? null, isLoading, error }
}

import useSWR from 'swr'

interface CanvasFeed {
  teams: any[]
  projects: any[]
  edges: any[]
  metadata: {
    totalTeams: number
    totalProjects: number
    totalStars: number
    lastUpdated: string
  }
}

const fetcher = (url: string) => fetch(url).then(res => res.json())

export function useCanvasData() {
  const { data, error, isLoading, mutate } = useSWR<CanvasFeed>(
    '/api/canvas/feed',
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 60000,
      refreshInterval: 0,
    }
  )

  return {
    data: data,
    isLoading,
    error,
    refresh: mutate,
  }
}
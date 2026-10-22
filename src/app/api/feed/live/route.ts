import { NextResponse } from 'next/server'
import { fetchCanvasFeed, fetchRecentEvents } from '@/lib/terminal/feedServer'

export async function GET() {
  const [feed, recentEvents] = await Promise.all([
    fetchCanvasFeed(),
    fetchRecentEvents(30),
  ])

  return NextResponse.json(
    { ...feed, events: recentEvents },
    {
      headers: {
        'Cache-Control': 'public, max-age=30, stale-while-revalidate=120',
      }
    }
  )
}

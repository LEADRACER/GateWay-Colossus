import { NextResponse } from 'next/server'
import { fetchCanvasFeed } from '@/lib/terminal/feedServer'

export async function GET() {
  const feed = await fetchCanvasFeed()

  return NextResponse.json(feed, {
    headers: {
      'Cache-Control': 'public, max-age=60, stale-while-revalidate=300',
    }
  })
}

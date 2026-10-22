import { HeroTerminal } from '@/components/sections/HeroTerminal'
import { ShowcaseBoard } from '@/components/sections/ShowcaseBoard'
import { TrendingList } from '@/components/sections/TrendingList'
import { TeamsIndex } from '@/components/sections/TeamsIndex'
import { LiveFeedStrip } from '@/components/sections/LiveFeedStrip'

export default function HomePage() {
  return (
    <div className="relative">
      <HeroTerminal />
      <ShowcaseBoard />
      <TrendingList />
      <TeamsIndex />
      <LiveFeedStrip />
    </div>
  )
}

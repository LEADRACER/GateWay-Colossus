import { COPY } from '@/components/shell/copy'

export default function UIShelfPage() {
  return (
    <div className="max-w-6xl mx-auto px-6 py-16">
      <h1 className="font-mono text-lg text-text">
        <span className="text-green-bright">{COPY.brand.line2}</span>
        <span className="text-text-dim">{` \u2014 ui shelf placeholder \u2014 `}</span>
      </h1>
      <p className="mt-4 font-mono text-sm text-text-dim">
        primitives + motion shelf — built in P2. this placeholder keeps the footer link honest.
      </p>
    </div>
  )
}

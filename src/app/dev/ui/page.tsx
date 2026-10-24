'use client'

import { useState } from 'react'
import { Coffee } from 'lucide-react'
import { COPY } from '@/components/shell/copy'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { Skeleton, SkeletonCard } from '@/components/ui/Skeleton'
import { Spinner } from '@/components/ui/Spinner'
import { EmptyState } from '@/components/ui/EmptyState'
import { ErrorMessage } from '@/components/ui/ErrorMessage'
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from '@/components/ui/Tabs'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/DropdownMenu'
import { useToast } from '@/components/ui/Toast'
import { Stagger, StaggerRow, FadeIn, CountUp } from '@/components/motion'
import { useTerminalFeed } from '@/hooks/useTerminalFeed'
import { useTerminalEvents } from '@/hooks/useTerminalEvents'

const SWATCHES: { name: string; token: string }[] = [
  { name: 'bg', token: '#0a0f0b' },
  { name: 'bg-raised', token: '#10160f' },
  { name: 'surface', token: '#131a13' },
  { name: 'surface-alt', token: '#1e261e' },
  { name: 'border', token: '#2a3328' },
  { name: 'border-light', token: '#3a453a' },
  { name: 'text-dim', token: '#5a685a' },
  { name: 'text-muted', token: '#8a9a86' },
  { name: 'text', token: '#d8e4d6' },
  { name: 'green', token: '#4a7c53' },
  { name: 'green-bright', token: '#6cc47a' },
  { name: 'green-dim', token: '#2e4a33' },
  { name: 'gold', token: '#c8a96a' },
  { name: 'gold-dim', token: '#8a744a' },
  { name: 'error', token: '#c05b5b' },
  { name: 'info', token: '#7a9a8e' },
]

function Swatch({ name, token }: { name: string; token: string }) {
  return (
    <div className="flex items-center gap-2 font-mono text-[11px]">
      <span className="w-5 h-5 border border-border shrink-0" style={{ background: token }} />
      <span className="text-text-muted">{name}</span>
      <span className="text-text-dim">{token}</span>
    </div>
  )
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="stamp font-mono text-xs text-gold uppercase tracking-[0.08em]">
      {children}
    </h2>
  )
}

function ShelfBody() {
  const [modalOpen, setModalOpen] = useState(false)
  useTerminalEvents()
  const { feed } = useTerminalFeed()
  const toast = useToast()

  return (
    <div className="max-w-6xl mx-auto px-6 py-16 space-y-16">
      <header>
        <p className="font-mono text-xs uppercase tracking-[0.12em] text-gold mb-4">
          [ dev — ui shelf ]
        </p>
        <h1 className="font-mono font-bold text-text text-3xl md:text-4xl">
          COLOSSUS <span className="text-gold">ui</span> shelf
        </h1>
        <p className="mt-3 text-sm text-text-muted max-w-[64ch]">
          every primitive that pages are allowed to use. if a component is not on this
          shelf, do not use it. matte, square, phosphor.
        </p>
      </header>

      {/* Palette */}
      <section className="space-y-4">
        <Label>palette</Label>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {SWATCHES.map((s) => (
            <Swatch key={s.name} {...s} />
          ))}
        </div>
      </section>

      {/* Typography */}
      <section className="space-y-4">
        <Label>type</Label>
        <div className="space-y-3">
          <p className="font-mono font-bold text-text text-4xl md:text-6xl">display 900 — mono</p>
          <p className="text-2xl text-text">sans 24 — body large</p>
          <p className="text-base text-text-muted">
            sans 16 — body copy reads long lines comfortably against the phosphor.
          </p>
          <p className="font-mono text-xs text-text-dim">mono 12 — labels, status rows, chrome.</p>
          <p className="font-mono text-sm text-green-bright">mono 14 — signal text</p>
          <p className="font-mono text-sm text-gold">mono 14 — gold annotations</p>
        </div>
      </section>

      {/* Buttons */}
      <section className="space-y-4">
        <Label>buttons</Label>
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <Button>deploy</Button>
            <Button variant="secondary">secondary</Button>
            <Button variant="ghost">ghost</Button>
            <Button variant="danger">purge</Button>
            <Button loading>shipping</Button>
            <Button disabled>frozen</Button>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button size="sm">sm</Button>
            <Button size="md">md</Button>
            <Button size="lg">lg</Button>
          </div>
        </div>
      </section>

      {/* Badges */}
      <section className="space-y-4">
        <Label>badges</Label>
        <div className="flex flex-wrap gap-2">
          <Badge>default</Badge>
          <Badge variant="success">success</Badge>
          <Badge variant="warning">warning</Badge>
          <Badge variant="error">error</Badge>
          <Badge variant="info">info</Badge>
        </div>
      </section>

      {/* Cards */}
      <section className="space-y-4">
        <Label>cards</Label>
        <div className="grid gap-5 sm:grid-cols-3">
          <Card>static card — surface ramp + border</Card>
          <Card hover>hover card — color change only, no lift</Card>
          <Card className="border-l-2 border-gold">featured — gold left rule</Card>
        </div>
      </section>

      {/* Inputs */}
      <section className="space-y-4">
        <Label>inputs</Label>
        <div className="grid gap-4 sm:grid-cols-3">
          <Input label="default" placeholder="type a signal…" />
          <Input label="with hint" hint="press enter to submit" />
          <Input label="error state" error="repo not found" />
        </div>
      </section>

      {/* Tabs */}
      <section className="space-y-4">
        <Label>tabs</Label>
        <Tabs defaultValue="grid">
          <TabsList>
            <TabsTrigger value="grid">grid</TabsTrigger>
            <TabsTrigger value="list">list</TabsTrigger>
            <TabsTrigger value="map">map</TabsTrigger>
          </TabsList>
          <TabsContent value="grid" className="font-mono text-xs text-text-muted">
            [ grid view ]
          </TabsContent>
          <TabsContent value="list" className="font-mono text-xs text-text-muted">
            [ list view ]
          </TabsContent>
          <TabsContent value="map" className="font-mono text-xs text-text-muted">
            [ map view ]
          </TabsContent>
        </Tabs>
      </section>

      {/* Dropdown + Modal + Toast */}
      <section className="space-y-4">
        <Label>overlays</Label>
        <div className="flex flex-wrap items-center gap-3">
          <DropdownMenu>
            <DropdownMenuTrigger className="border border-border px-4 h-10 bg-bg-raised text-text font-mono text-xs uppercase tracking-[0.08em] hover:border-border-light">
              dropdown
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem>fork repo</DropdownMenuItem>
              <DropdownMenuItem>star</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>unwatch</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button variant="secondary" onClick={() => setModalOpen(true)}>open modal</Button>
          <Button
            variant="primary"
            onClick={() => toast.toast({ title: 'signal sent', description: 'feed channel acked your dispatch.', type: "success" })}
          >
            fire toast
          </Button>
        </div>
        <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="confirm dispatch">
          <p className="text-sm text-text-muted">
            this action writes to the public ledger. proceed?
          </p>
          <div className="mt-6 flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setModalOpen(false)}>cancel</Button>
            <Button onClick={() => { setModalOpen(false); toast.toast({ description: 'dispatch written to ledger.', type: 'success' }) }}>
              proceed
            </Button>
          </div>
        </Modal>
      </section>

      {/* Feedback */}
      <section className="space-y-4">
        <Label>feedback</Label>
        <div className="grid gap-6 sm:grid-cols-3">
          <Card>
            <EmptyState
              icon={<Coffee className="w-5 h-5 text-text-dim" />}
              title="nothing here yet"
              description="the archive is waiting for its first contribution."
            />
          </Card>
          <Card>
            <ErrorMessage message="feed channel offline — running on cache." />
          </Card>
          <Card className="flex flex-col items-center justify-center gap-4">
            <Spinner size="lg" />
            <span className="font-mono text-xs text-text-dim">spinner</span>
          </Card>
        </div>
        <div className="grid gap-5 sm:grid-cols-3">
          <SkeletonCard />
          <Card className="space-y-3">
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-32 w-full" />
          </Card>
        </div>
      </section>

      {/* Motion */}
      <section className="space-y-4">
        <Label>motion</Label>
        <div className="grid gap-5 sm:grid-cols-3">
          <Stagger className="space-y-3">
            <StaggerRow className="border border-border bg-bg-raised p-3 font-mono text-xs text-text-muted">stagger row 1</StaggerRow>
            <StaggerRow className="border border-border bg-bg-raised p-3 font-mono text-xs">stagger row 2</StaggerRow>
            <StaggerRow className="border border-border bg-bg-raised p-3 font-mono text-xs">stagger row 3</StaggerRow>
          </Stagger>
          <FadeIn variant="up">
            <Card className="font-mono text-3xl text-green-bright tabular-nums">
              ⭐ <CountUp value={feed?.metadata.totalStars ?? 0} duration={1} />
            </Card>
          </FadeIn>
          <FadeIn variant="fade">
            <Card>
              <p className="font-mono text-xs text-text-dim leading-relaxed">
                scroll-anchored fade-ins run once on mount. springs stay subtle
                (380/32). overlays fade, nothing bounces.
              </p>
            </Card>
          </FadeIn>
        </div>
      </section>

      <footer className="pt-8 border-t border-border font-mono text-xs text-text-dim flex justify-between">
        <span>{COPY.brand.line1.replace(/:$/, '')}<span className="text-gold">:</span>{COPY.brand.line2}</span>
        <span>ui shelf v2 — green-terminal spec</span>
      </footer>
    </div>
  )
}

// root layout already provides ToastProvider — nesting here would shadow the
// global context and break toasts fired by components outside this page
export default function UIShelfPage() {
  return <ShelfBody />
}

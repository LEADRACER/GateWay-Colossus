import { C } from '@/lib/terminal/palette'
import { formatEventLine, getTerminalEvents, subscribeTerminalEvents, type TerminalEvent } from '../events'
import type { TerminalScene, TerminalSceneCtx } from '../types'

export class TickerScene implements TerminalScene {
  name = 'ticker'

  private unsubscribe: (() => void) | null = null
  private tick = 0

  reset(ctx: TerminalSceneCtx): void {
    if (!this.unsubscribe) {
      this.unsubscribe = subscribeTerminalEvents(() => {})
    }
    void ctx
  }

  destroy(): void {
    this.unsubscribe?.()
    this.unsubscribe = null
  }

  update(ctx: TerminalSceneCtx): void {
    const { buffer, feed } = ctx
    buffer.clear()

    const now = Date.now()
    const events = getTerminalEvents()
    const innerH = buffer.rows - 2
    const stats = feed?.metadata

    buffer.segment(1, 0, [
      { text: 'top', fg: C.GREEN_BRIGHT, bold: true },
      { text: ' — gateway process monitor', fg: C.FG_MUTED },
    ])
    buffer.rightWrite(0, stats ? 'feed sync ok' : 'feed offline', 1, { fg: C.FG_GHOST, dim: true })

    const statLine = stats
      ? `${stats.totalProjects} proj · ${stats.totalTeams} teams · ★ ${stats.totalStars.toLocaleString('en-US')}`
      : 'no feed data yet'
    buffer.write(1, 2, statLine, { fg: C.FG_DIM })

    buffer.hline(1, 1, buffer.cols - 2, '─', { fg: C.FG_GHOST })
    buffer.hline(1, 3, buffer.cols - 2, '─', { fg: C.FG_GHOST })

    const listTop = 4
    const listH = Math.max(3, innerH - listTop - 1)
    const visible = events.slice(Math.max(0, events.length - listH))

    this.tick++
    visible.forEach((e: TerminalEvent, i: number) => {
      const row = listTop + i
      const highlighted = now - e.at < 2500
      buffer.segment(2, row, [
        {
          text: formatEventLine(e, now),
          fg: highlighted ? e.color : C.FG_MUTED,
          bold: highlighted,
        },
      ])
    })

    if (events.length === 0) {
      buffer.write(2, listTop, 'awaiting first event from the collective...', { fg: C.FG_GHOST })
    }

    buffer.rightWrite(buffer.rows - 2, `events ${events.length} · realtime live`, 1, { fg: C.FG_GHOST, dim: true })
  }
}

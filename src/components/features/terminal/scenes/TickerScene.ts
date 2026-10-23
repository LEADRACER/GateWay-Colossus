import { C, type ColorIndex } from '@/lib/terminal/palette'
import { EVENT_ICONS, getTerminalEvents, subscribeTerminalEvents, type TerminalEvent } from '../events'
import type { TerminalScene, TerminalSceneCtx } from '../types'
import { hash, hash01, clamp } from './util'

const SPARK_CHARS = '▁▂▃▄▅▆▇█'

function pad(n: number, w: number): string {
  return String(n).padStart(w, ' ')
}

function uptime(now: number): string {
  const secs = Math.floor(now / 1000)
  const days = Math.floor(secs / 86400)
  const hh = Math.floor((secs % 86400) / 3600)
  const mm = Math.floor((secs % 3600) / 60)
  return days > 0 ? `${days}d ${pad(hh, 2)}:${pad(mm, 2)}` : `${pad(hh, 2)}:${pad(mm, 2)}`
}

export class TickerScene implements TerminalScene {
  name = 'ticker'

  private unsubscribe: (() => void) | null = null

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
    const { buffer, feed, time } = ctx
    buffer.clear()

    const now = Date.now()
    const events = getTerminalEvents()
    const innerH = buffer.rows - 2
    const stats = feed?.metadata

    // ── header: top - 14:22:07 up 3d 04:11, load average: 0.42, 0.38, 0.31
    const loadBase = stats ? clamp(0.2 + events.length / 60, 0.1, 4) : 0
    const wobble = Math.sin(time * 0.7) * 0.06 + Math.sin(time * 2.3 + 1) * 0.03
    const l1 = clamp(loadBase + wobble, 0.02, 6)
    const l5 = clamp(loadBase + Math.sin(time * 0.31) * 0.1 - 0.04, 0.02, 6)
    const l15 = clamp(loadBase + Math.sin(time * 0.11) * 0.08 - 0.08, 0.02, 6)
    buffer.segment(1, 0, [
      { text: 'top', fg: C.GREEN_BRIGHT, bold: true },
      { text: ' - gateway', fg: C.FG_MUTED },
      { text: ` up ${uptime(now)}`, fg: C.FG },
      { text: `,  load average: ${l1.toFixed(2)}, ${l5.toFixed(2)}, ${l15.toFixed(2)}`, fg: C.FG },
    ])
    buffer.rightWrite(0, stats ? 'feed sync ok' : 'feed offline', 1, { fg: C.FG_GHOST, dim: true })

    buffer.hline(1, 1, buffer.cols - 2, '─', { fg: C.FG_GHOST })

    // ── task summary line
    const recent = events.filter((e) => now - e.at < 60000).length
    const statParts: Array<{ text: string; fg: ColorIndex }> = [
      { text: `Tasks: ${events.length} total, `, fg: C.FG },
      { text: `${recent} recent`, fg: recent > 0 ? C.GREEN_BRIGHT : C.FG_DIM },
      { text: ` (60s window)`, fg: C.FG },
    ]
    if (stats) {
      statParts.push({ text: ` — ${stats.totalProjects} proj · ${stats.totalTeams} teams · `, fg: C.FG })
      statParts.push({ text: `★ ${stats.totalStars.toLocaleString('en-US')}`, fg: C.AMBER })
    }
    buffer.segment(1, 2, statParts)

    buffer.hline(1, 3, buffer.cols - 2, '─', { fg: C.FG_GHOST })

    const listTop = 4
    const listH = Math.max(3, innerH - listTop - 3)

    // ── column header
    const hasRows = events.length > 0
    if (hasRows) {
      buffer.segment(2, listTop, [
        { text: '  PID', fg: C.FG_DIM, bold: true },
        { text: ' USER    CPU%', fg: C.FG_DIM, bold: true },
        { text: '  AGE', fg: C.FG_DIM, bold: true },
        { text: '  EVENT STREAM', fg: C.FG_DIM, bold: true },
      ])
    }

    // ── process rows (newest on top; CPU jitter is per-event deterministic)
    const rows = [...events].reverse().slice(0, listH)
    const visible: Array<{ line: string; pid: number; cpu: number; hot: boolean; i: number }> = rows.map((e: TerminalEvent, i: number) => {
      const pid = (hash(e.id) % 9000) + 1000
      const hot = now - e.at < 2500
      // cpu falls asleep as the event ages
      const cp = hot ? 60 + (hash(e.id) % 400) / 10 : 0.3 + hash01(e.id) * (3 - Math.min(3, (now - e.at) / 60000))
      const wob = hot ? Math.sin(time * 4 + i) * 4 : Math.sin(time * 0.9 + i * 1.7) * 0.15
      const cpu = Math.max(0, cp + wob)
      const ageSecs = Math.max(0, Math.floor((now - e.at) / 1000))
      const age = ageSecs < 60 ? `${ageSecs}s` : `${Math.floor(ageSecs / 60)}m`
      const line = `${EVENT_ICONS[e.kind]} ${e.text.slice(0, 64)}`
      return { line: `${line} · ${age}`, pid, cpu, hot, i }
    })
    // rows read newest-first like a live feed; no per-frame resort churn
    let row = listTop + 1
    for (const r of visible) {
      if (row > listTop + listH) break
      const cpuColor = r.cpu > 55 ? C.AMBER : r.hot ? C.GREEN_BRIGHT : C.FG_DIM
      buffer.segment(2, row, [
        { text: pad(r.pid, 5), fg: C.FG_DIM },
        { text: ' curato', fg: r.hot ? C.CYAN : C.FG_GHOST },
        { text: ` ${r.cpu.toFixed(1).padStart(5)}%`, fg: cpuColor },
        { text: '  0:00    ', fg: C.FG_GHOST },
        { text: r.line, fg: r.hot ? C.WHITE : C.FG_MUTED, bold: r.hot },
      ])
      row++
    }

    if (!hasRows) {
      buffer.write(2, listTop + 1, 'awaiting first event from the collective...', { fg: C.FG_GHOST })
    }

    // ── footer: events-per-minute sparkline + status
    const footerRow = buffer.rows - 2
    const buckets = new Array(24).fill(0)
    for (const e of events) {
      const age = now - e.at
      if (age > 120000) continue
      const slot = clamp(23 - Math.floor(age / 5000), 0, 23)
      buckets[slot]++
    }
    const peak = Math.max(1, ...buckets)
    const spark = buckets.map((b) => SPARK_CHARS[Math.floor((b / peak) * (SPARK_CHARS.length - 1))]).join('')
    buffer.segment(2, footerRow, [
      { text: 'rate ', fg: C.FG_GHOST },
      { text: spark, fg: recent > 0 ? C.CYAN : C.FG_DIM },
      { text: `  events ${events.length} · realtime live`, fg: C.FG_GHOST, dim: true },
    ])
  }
}

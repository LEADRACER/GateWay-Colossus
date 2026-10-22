import type { CellBuffer } from '@/lib/terminal/CellBuffer'
import { C, type ColorIndex } from '@/lib/terminal/palette'
import type { TerminalScene, TerminalSceneCtx } from '../types'

interface Seg {
  text: string
  fg?: ColorIndex
  bold?: boolean
  dim?: boolean
}

const TYPE_CPS = 480
const LINE_GAP = 0.22
const FINISH_HOLD = 1.4
const BAR_WIDTH = 22

export function bar(fraction: number, width: number = BAR_WIDTH, fg: ColorIndex = C.GREEN): Seg[] {
  const filled = Math.max(0, Math.min(width, Math.round(fraction * width)))
  return [
    { text: '[', fg: C.FG_DIM },
    { text: '#'.repeat(filled), fg },
    { text: '.'.repeat(width - filled), fg: C.FG_DIM },
    { text: '] ', fg: C.FG_DIM },
  ]
}

function pad(end: string, width: number): string {
  return '.'.repeat(Math.max(1, width - end.length - 1)) + end
}

function num(n: number): string {
  return n > 0 ? n.toLocaleString('en-US') : '--'
}

const OK: Seg = { text: 'OK', fg: C.GREEN_BRIGHT }
const LIVE: Seg = { text: 'LIVE', fg: C.CYAN, bold: true }

function buildLines(feed: TerminalSceneCtx['feed']): Seg[][] {
  const meta = feed?.metadata
  const teamCount = feed?.teams.length ?? 0
  const projectCount = feed?.projects.length ?? 0
  const stars = meta?.totalStars ?? 0
  return [
    [
      { text: '$ ', fg: C.GREEN_BRIGHT },
      { text: 'ssh root@gateway.colossus --port tty1', fg: C.FG_BRIGHT, bold: true },
    ],
    [
      { text: 'connecting to gateway.colossus ', fg: C.FG },
      { text: pad('OK', 6) + ' ', fg: C.FG_DIM },
      { text: '[', fg: C.FG_DIM }, OK, { text: ']', fg: C.FG_DIM },
    ],
    [
      { text: 'booting kernel ', fg: C.FG },
      { text: 'v0.1.0-phosphor ', fg: C.FG_MUTED },
      { text: pad('OK', 6) + ' ', fg: C.FG_DIM },
      { text: '[', fg: C.FG_DIM }, OK, { text: ']', fg: C.FG_DIM },
    ],
    [
      { text: 'loading project index ', fg: C.FG },
      ...bar(Math.min(1, (projectCount + 1) / Math.max(2, projectCount + 2))),
      { text: `${num(projectCount)} records`, fg: C.CYAN },
    ],
    [
      { text: 'syncing teams ledger ', fg: C.FG },
      ...bar(Math.min(1, (teamCount + 1) / Math.max(2, Math.max(teamCount, 12) + 2)), BAR_WIDTH, C.CYAN),
      { text: `${num(teamCount)} teams`, fg: C.CYAN },
    ],
    [
      { text: 'counting stars ', fg: C.FG },
      ...bar(Math.min(1, stars / 50000), BAR_WIDTH, C.AMBER),
      { text: `★ ${num(stars)}`, fg: C.AMBER },
    ],
    [
      { text: 'verifying archive integrity ', fg: C.FG },
      { text: pad('SHA-256', 6) + ' ', fg: C.FG_DIM },
      { text: '[', fg: C.FG_DIM }, OK, { text: ']', fg: C.FG_DIM },
    ],
    [
      { text: 'establishing feed channel ', fg: C.FG },
      { text: pad('REALTIME', 6) + ' ', fg: C.FG_DIM },
      { text: '[', fg: C.FG_DIM }, LIVE, { text: ']', fg: C.FG_DIM },
    ],
  ]
}

const BANNER: Seg[][] = [
  [{ text: '╔══════════════════════════════════════╗', fg: C.GREEN_DEEP }],
  [
    { text: '║ ', fg: C.GREEN_DEEP },
    { text: '▸  GATEWAY : COLOSSUS  ◂', fg: C.GREEN_BRIGHT, bold: true },
    { text: ' ║', fg: C.GREEN_DEEP },
  ],
  [{ text: '╚══════════════════════════════════════╝', fg: C.GREEN_DEEP }],
  [{ text: ' the archive is awake — a living record of what we ship', fg: C.FG_MUTED }],
]

const lineLength = (line: Seg[]): number => line.reduce((a, s) => a + s.text.length, 0)

export class BootScene implements TerminalScene {
  name = 'boot'

  private dynamicLines: Seg[][] = []
  private staticLines: Seg[][] = buildLines(null)
  private typedLen: number[] = []
  private lineIndex = 0
  private typed = 0
  private gapTimer = 0
  private finished = 0

  reset(ctx: TerminalSceneCtx): void {
    this.dynamicLines = buildLines(ctx.feed)
    this.typedLen = this.dynamicLines.map(lineLength)
    this.lineIndex = 0
    this.typed = 0
    this.gapTimer = 0
    this.finished = 0
  }

  private bannerHeight(cols: number): number {
    return cols >= BANNER[0][0].text.length + 6 ? BANNER.length : 0
  }

  update(ctx: TerminalSceneCtx): void {
    const { buffer, feed, reducedMotion } = ctx
    if (feed) this.staticLines = this.dynamicLines = buildLines(feed)

    const lines = this.dynamicLines.length ? this.dynamicLines : this.staticLines
    const innerH = buffer.rows - 2
    const bannerH = this.bannerHeight(buffer.cols)
    const maxVisible = Math.max(4, innerH - bannerH)

    if (reducedMotion) {
      this.lineIndex = lines.length
    } else if (this.lineIndex < lines.length) {
      this.typed += TYPE_CPS * ctx.dt
      const total = this.typedLen[this.lineIndex]
      if (this.typed >= total) {
        this.gapTimer += ctx.dt
        if (this.gapTimer >= LINE_GAP) {
          this.lineIndex++
          this.typed = 0
          this.gapTimer = 0
        }
      }
    } else {
      this.finished += ctx.dt
      if (this.finished >= FINISH_HOLD) {
        ctx.requestSwitch('rain')
        return
      }
    }

    this.draw(buffer, lines, maxVisible, bannerH)
  }

  private draw(buffer: CellBuffer, lines: Seg[][], maxVisible: number, bannerH: number): void {
    buffer.clear()

    const startLine = Math.max(0, this.lineIndex - maxVisible + 1)
    let row = 1

    for (let li = startLine; li < lines.length && li < startLine + maxVisible; li++) {
      const line = lines[li]
      const budget = li === this.lineIndex ? Math.floor(this.typed) : lineLength(line)
      let cx = 2
      let drawn = 0
      let typedLine = false
      for (const seg of line) {
        if (cx >= buffer.cols - 2 || drawn >= budget) break
        const take = Math.min(seg.text.length, budget - drawn)
        cx = buffer.write(cx, row, seg.text.slice(0, take), { fg: seg.fg, bold: seg.bold, dim: seg.dim })
        drawn += take
        typedLine = drawn >= budget
        if (typedLine) break
      }
      if (typedLine && row < buffer.rows - 2) {
        buffer.put(Math.min(cx + 1, buffer.cols - 3), row, '▌', { fg: C.GREEN_BRIGHT })
      }
      row++
    }

    if (bannerH > 0) {
      const bannerRow = buffer.rows - 2 - bannerH
      for (let i = 0; i < BANNER.length; i++) {
        buffer.segment(2, bannerRow + i, BANNER[i])
      }
    }
  }
}

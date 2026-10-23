import { C, type ColorIndex } from '@/lib/terminal/palette'
import type { TerminalScene, TerminalSceneCtx, TerminalFeed } from '../types'
import { getTerminalEvents } from '../events'
import { randInt } from './util'

const KATAKANA = 'ｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﬀﬁ'.split('')
const CODE = '<>[]{}/*+#$%&@!?;:~^'.split('')
const BINARY = '01'.split('')

interface Drop {
  col: number
  y: number
  speed: number
  len: number
  glyphs: string[]
  bright: boolean
}

interface Ember {
  col: number
  y: number
  speed: number
}

interface Pulse {
  row: number
  col: number
  text: string
  color: ColorIndex
  typed: number
  speed: number
}

interface Scanline {
  row: number
  life: number
}

export class RainScene implements TerminalScene {
  name = 'rain'

  private drops: Drop[] = []
  private embers: Ember[] = []
  private pulses: Pulse[] = []
  private scanlines: Scanline[] = []
  private pulseTimer = 1.2
  private scanTimer = 5
  private lastPointerCol = -1
  private cols = 0
  private rows = 0

  reset(ctx: TerminalSceneCtx): void {
    this.resize(ctx)
    this.pulses = []
    this.embers = []
    this.scanlines = []
    this.pulseTimer = 1.2
    this.scanTimer = 5
    this.lastPointerCol = -1
    for (let c = 0; c < this.cols; c++) {
      if (Math.random() < 0.86) continue
      this.drops.push(this.makeDrop(c, Math.random() * this.rows, true))
    }
  }

  private makeDrop(col: number, y: number, bright: boolean): Drop {
    const len = randInt(4, 16)
    const l = Math.random()
    const charset = l < 0.58 ? KATAKANA : l < 0.8 ? BINARY : CODE
    const glyphs = Array.from({ length: len }, () => charset[randInt(0, charset.length - 1)])
    return {
      col,
      y: y % Math.max(1, this.rows),
      speed: 1.8 + Math.random() * 7,
      len,
      glyphs,
      bright: bright || Math.random() < 0.12,
    }
  }

  private resize(ctx: TerminalSceneCtx): void {
    const innerRows = Math.max(4, ctx.buffer.rows - 2)
    if (ctx.buffer.cols !== this.cols || innerRows !== this.rows) {
      this.cols = ctx.buffer.cols
      this.rows = innerRows
      this.drops = []
      for (let c = 0; c < this.cols; c++) {
        if (Math.random() < 0.7) continue
        this.drops.push(this.makeDrop(c, Math.random() * this.rows, Math.random() < 0.12))
      }
    }
  }

  private spawnPulse(feed: TerminalFeed | null): void {
    // prefer real activity from the event ring so typed pulses match live traffic
    const events = getTerminalEvents()
    if (events.length) {
      const e = events[randInt(0, Math.min(events.length, 20) - 1)]
      const text = e.text.length > 44 ? `${e.text.slice(0, 43)}…` : e.text
      this.pulses.push({
        row: randInt(2, Math.max(2, this.rows - 3)),
        col: randInt(1, Math.max(1, Math.floor(this.cols / 8))),
        text,
        color: e.color ?? C.GREEN_BRIGHT,
        typed: -2,
        speed: 14 + Math.random() * 18,
      })
      return
    }
    if (!feed) return
    const sources = feed.projects.map((p) => p.name).concat(feed.teams.map((t) => t.name.toUpperCase()))
    if (!sources.length) return
    const text = sources[randInt(0, sources.length - 1)]
    this.pulses.push({
      row: randInt(2, Math.max(2, this.rows - 3)),
      col: randInt(1, Math.max(1, Math.floor(this.cols / 6))),
      text,
      color: Math.random() < 0.5 ? C.CYAN : C.GREEN_BRIGHT,
      typed: -2,
      speed: 14 + Math.random() * 18,
    })
  }

  update(ctx: TerminalSceneCtx): void {
    const { buffer, feed, reducedMotion, pointer } = ctx
    this.resize(ctx)
    buffer.clear()

    if (!reducedMotion) {
      if (Math.random() < 0.07) {
        this.drops.push(this.makeDrop(randInt(0, this.cols - 1), 0, Math.random() < 0.15))
      }
      // slow rising amber embers for depth
      if (Math.random() < 0.05 && this.embers.length < 6) {
        this.embers.push({ col: randInt(0, this.cols - 1), y: this.rows, speed: 0.8 + Math.random() * 1.4 })
      }

      for (const drop of this.drops) drop.y += drop.speed * ctx.dt
      for (const ember of this.embers) ember.y -= ember.speed * ctx.dt
      this.drops = this.drops.filter((d) => d.y - d.len < this.rows + 2)
      this.embers = this.embers.filter((e) => e.y > -1)

      this.pulseTimer -= ctx.dt
      if (this.pulseTimer <= 0) {
        this.pulseTimer = 1.4 + Math.random() * 1.2
        this.spawnPulse(feed)
      }

      // rare scanline glitch band sweeping the screen
      this.scanTimer -= ctx.dt
      if (this.scanTimer <= 0) {
        this.scanTimer = 6 + Math.random() * 9
        this.scanlines.push({ row: randInt(2, Math.max(2, this.rows - 4)), life: 0.55 })
      }
      for (const s of this.scanlines) s.life -= ctx.dt
      this.scanlines = this.scanlines.filter((s) => s.life > 0)

      // pointer accelerates rain and occasionally spawns a fresh drop beside it
      if (pointer.present) {
        for (const drop of this.drops) {
          const dist = Math.abs(drop.col - pointer.col)
          if (dist < 6) drop.speed *= 1 + 0.5 * (1 - dist / 6)
        }
        const movedFast = Math.abs(pointer.col - this.lastPointerCol) > 3
        if (movedFast && Math.random() < 0.5) {
          const col = Math.max(0, Math.min(this.cols - 1, pointer.col + randInt(-2, 2)))
          if (Math.random() < 0.6) this.drops.push(this.makeDrop(col, 0, true))
        }
        this.lastPointerCol = pointer.col
      }
    }

    for (const drop of this.drops) {
      const head = Math.min(this.rows - 1, Math.floor(drop.y))
      for (let i = 0; i < drop.len; i++) {
        const row = head - i
        if (row < 0 || row >= this.rows - 2) continue
        const fade = 1 - i / drop.len
        let fg: ColorIndex
        if (i === 0) {
          fg = drop.bright ? C.WHITE : C.GREEN_BRIGHT
        } else if (!ctx.reducedMotion && fade > 0.75) {
          fg = drop.bright ? C.FG_BRIGHT : C.GREEN
        } else if (fade > 0.45) {
          fg = C.GREEN_DEEP
        } else if (fade > 0.2) {
          fg = C.FG_DIM
        } else {
          fg = C.FG_GHOST
        }
        const ch = drop.glyphs[i % drop.glyphs.length]
        buffer.put(drop.col, row + 1, ch, { fg })
      }
    }

    for (const ember of this.embers) {
      const row = Math.floor(ember.y)
      if (row < 1 || row >= this.rows - 2) continue
      buffer.put(ember.col, row + 1, '·', { fg: C.AMBER, dim: true })
    }

    for (const s of this.scanlines) {
      const row = s.row
      const strength = Math.min(1, s.life / 0.55)
      for (let x = 0; x < this.cols; x += 3) {
        const cell = buffer.get(x, row + 1)
        if (cell.ch && cell.ch !== ' ') {
          buffer.put(x, row + 1, randInt(0, 2) === 0 ? '░' : cell.ch, { fg: strength > 0.5 ? C.CYAN : C.FG_DIM })
        }
      }
    }

    for (const pulse of this.pulses) {
      if (pulse.typed < 0) continue
      const visible = pulse.text.slice(0, Math.floor(pulse.typed))
      const x = Math.min(pulse.col + Math.floor(pulse.typed), buffer.cols - 1)
      for (let i = 0; i < visible.length; i++) {
        const px = pulse.col + i
        if (px >= buffer.cols - 1) break
        const age = pulse.typed - i
        const fg = age < 6 ? pulse.color : age < 14 ? C.GREEN_DEEP : C.FG_DIM
        buffer.put(px, pulse.row + 1, visible[i], { fg })
      }
      if (pulse.typed < pulse.text.length) {
        buffer.put(Math.min(x + 1, buffer.cols - 2), pulse.row + 1, '▌', { fg: C.WHITE })
      }
    }

    if (!ctx.reducedMotion) {
      for (const pulse of this.pulses) pulse.typed += pulse.speed * ctx.dt
      this.pulses = this.pulses.filter((p) => p.typed < p.text.length + 14)
    }
  }
}

import { C, type ColorIndex } from '@/lib/terminal/palette'
import type { TerminalFeedTeam } from '../types'
import { glyphs, type TerminalScene, type TerminalSceneCtx } from '../types'
import { hash, hash01, clamp } from './util'

const ORBIT_GLYPH = glyphs.orbit

interface PlacedNode {
  team: TerminalFeedTeam
  col: number
  row: number
}

interface Packet {
  edgeIndex: number
  t: number
  speed: number
  fg: ColorIndex
}

interface Comet {
  fromCol: number
  fromRow: number
  toCol: number
  toRow: number
  t: number
  speed: number
}

export class ConstellationScene implements TerminalScene {
  name = 'constellation'

  private placed: PlacedNode[] = []
  private edges: Array<{ a: PlacedNode; b: PlacedNode; weight: number }> = []
  private packets: Packet[] = []
  private comet: Comet | null = null
  private cometGap = 3
  private lastCols = 0
  private lastRows = 0

  reset(ctx: TerminalSceneCtx): void {
    this.layout(ctx)
    this.packets = []
    this.comet = null
    this.cometGap = 3
  }

  private layout(ctx: TerminalSceneCtx): void {
    const { buffer, feed } = ctx
    if (buffer.cols === this.lastCols && buffer.rows === this.lastRows && this.placed.length) return
    this.lastCols = buffer.cols
    this.lastRows = buffer.rows
    this.placed = []
    this.edges = []
    this.packets = []
    if (!feed) return

    const innerH = buffer.rows - 2
    const mapX = (nx: number) => {
      const inset = 6
      return Math.min(buffer.cols - 3, inset + Math.floor(nx * (buffer.cols - inset - 3)))
    }
    const mapY = (ny: number) => {
      const top = 2
      return Math.min(innerH - 2, top + Math.floor(ny * (innerH - top - 3)))
    }

    const jitter = (id: string, amp: number) => (hash(id) % (2 * amp)) - amp

    for (const team of feed.teams) {
      this.placed.push({
        team,
        col: mapX(team.position[0]) + jitter(team.id, 3),
        row: mapY(team.position[1]) + jitter(team.id, 2),
      })
    }

    const byCode = new Map(this.placed.map((p) => [p.team.code, p]))
    for (const edge of feed.edges) {
      const a = byCode.get(edge.source)
      const b = byCode.get(edge.target)
      if (a && b && a !== b) this.edges.push({ a, b, weight: edge.weight })
    }
  }

  private drawEdge(ctx: TerminalSceneCtx, a: PlacedNode, b: PlacedNode, weight: number): void {
    const { buffer } = ctx
    const steps = Math.max(Math.abs(b.col - a.col), Math.abs(b.row - a.row))
    if (steps < 2) return
    const dim = weight < 0.5
    for (let i = 1; i < steps; i++) {
      const t = i / steps
      const x = Math.round(a.col + (b.col - a.col) * t)
      const y = Math.round(a.row + (b.row - a.row) * t)
      const existing = buffer.get(x, y)
      if (existing.ch && existing.ch !== ' ') continue
      buffer.put(x, y, '·', { fg: C.FG_GHOST, dim })
    }
  }

  private spawnPacket(index: number, weight: number): void {
    // heavier links traffic packets more often; keep global count bounded
    if (this.packets.length >= 10) return
    if (Math.random() > clamp(weight, 0.15, 1) * 0.5) return
    const fg = weight > 0.66 ? C.AMBER : C.CYAN
    this.packets.push({ edgeIndex: index, t: 0, speed: 0.35 + Math.random() * 0.3, fg })
  }

  private drawPacket(ctx: TerminalSceneCtx, p: Packet): void {
    const { buffer } = ctx
    const e = this.edges[p.edgeIndex]
    if (!e) return
    const x = Math.round(e.a.col + (e.b.col - e.a.col) * p.t)
    const y = Math.round(e.a.row + (e.b.row - e.a.row) * p.t)
    if (buffer.inBounds(x, y)) {
      buffer.put(x, y, '▸', { fg: p.fg, bold: true })
    }
    // short fading tail one step behind
    const tp = Math.max(0, p.t - 0.06)
    const tx = Math.round(e.a.col + (e.b.col - e.a.col) * tp)
    const ty = Math.round(e.a.row + (e.b.row - e.a.row) * tp)
    if (buffer.inBounds(tx, ty) && !(tx === x && ty === y)) {
      buffer.put(tx, ty, '·', { fg: p.fg, dim: true })
    }
  }

  private drawHoverPanel(ctx: TerminalSceneCtx, node: PlacedNode): void {
    const { buffer, feed } = ctx
    if (!feed) return
    const team = node.team
    const teamStars = feed.projects
      .filter((p) => p.teamId === team.id)
      .reduce((a, p) => a + p.stars, 0)
    const l1 = `▸ ${team.name}`
    const l2 = `${team.memberCount} members · ${team.projectCount} projects · ★ ${teamStars.toLocaleString('en-US')}`
    const w = Math.max(l1.length, l2.length) + 2
    const h = 4
    let bx = node.col + 3
    let by = node.row + 1
    if (bx + w >= buffer.cols - 1) bx = Math.max(1, node.col - w - 2)
    if (by + h >= buffer.rows - 2) by = Math.max(1, node.row - h)
    buffer.box(bx, by, w, h, { fg: C.FG_DIM })
    buffer.write(bx + 1, by + 1, l1, { fg: C.GREEN_BRIGHT, bold: true })
    buffer.write(bx + 1, by + 2, l2, { fg: C.FG_MUTED })
  }

  update(ctx: TerminalSceneCtx): void {
    const { buffer, feed, time, pointer, reducedMotion } = ctx
    this.layout(ctx)
    buffer.clear()

    if (!feed || this.placed.length === 0) {
      buffer.write(2, 1, 'constellation offline — no team data yet', { fg: C.FG_DIM })
      buffer.write(2, 2, 'waiting for first teams to dock', { fg: C.FG_GHOST })
      return
    }

    for (const e of this.edges) this.drawEdge(ctx, e.a, e.b, e.weight)

    if (!reducedMotion) {
      // companion traffic along links
      this.edges.forEach((e, i) => {
        const phase = hash01(`${e.a.team.code}${e.b.team.code}`) * 8
        const inWindow = (time + phase) % 8 < 0.2
        const alreadyMoving = this.packets.some((p) => p.edgeIndex === i)
        if (inWindow && !alreadyMoving) this.spawnPacket(i, e.weight)
      })
      for (const p of this.packets) p.t += p.speed * ctx.dt
      this.packets = this.packets.filter((p) => p.t <= 1)
      for (const p of this.packets) this.drawPacket(ctx, p)

      // rare comet streak across the chart
      this.cometGap -= ctx.dt
      if (this.comet) {
        this.comet.t += this.comet.speed * ctx.dt
        const c = this.comet
        for (let k = 0; k < 4; k++) {
          const tt = c.t - k * 0.035
          if (tt < 0 || tt > 1) continue
          const x = Math.round(c.fromCol + (c.toCol - c.fromCol) * tt)
          const y = Math.round(c.fromRow + (c.toRow - c.fromRow) * tt)
          if (buffer.inBounds(x, y)) {
            buffer.put(x, y, k === 0 ? '✦' : '·', { fg: k === 0 ? C.WHITE : C.FG_GHOST })
          }
        }
        if (c.t >= 1) this.comet = null
      } else if (this.cometGap <= 0) {
        this.cometGap = 9 + Math.random() * 8
        const fromRow = 1 + Math.floor(Math.random() * (buffer.rows * 0.4))
        const fromCol = Math.floor(Math.random() * buffer.cols * 0.5)
        const span = Math.floor(buffer.cols * (0.2 + Math.random() * 0.25))
        this.comet = {
          fromCol,
          fromRow,
          toCol: Math.min(buffer.cols - 2, fromCol + span),
          toRow: Math.min(buffer.rows - 3, fromRow + Math.round(span * 0.35)),
          t: 0,
          speed: 0.9 + Math.random() * 0.5,
        }
      }
    }

    const orbiters = feed.projects.filter((p) => p.teamId).slice(0, 40)
    let hovered: PlacedNode | null = null

    for (const node of this.placed) {
      const nodeTeam = node.team
      const showcased = nodeTeam.isShowcased
      const hue = hash(nodeTeam.name) % 3
      const nodeColor: ColorIndex = showcased ? C.GREEN_BRIGHT : hue === 0 ? C.GREEN : hue === 1 ? C.CYAN : C.BLUE

      const near =
        pointer.present &&
        Math.abs(pointer.col - node.col) < 3 &&
        Math.abs(pointer.row - node.row) < 2
      if (near) hovered = node
      else if (!hovered && pointer.present && Math.abs(pointer.col - node.col) < 6 && Math.abs(pointer.row - node.row) < 3) {
        hovered = node
      }

      // twinkle: brightest nodes blink periodically at deterministic phase
      const twinkleOn = showcased || ((Math.floor(time * 1.6 + hash01(nodeTeam.id) * 6) % 5) !== 0)
      buffer.put(node.col, node.row, near ? glyphs.block : glyphs.node, {
        fg: near ? C.WHITE : nodeColor,
        bold: twinkleOn,
      })

      // showcased halo pulse ring
      if (showcased && !reducedMotion) {
        const pulseOn = Math.floor(time * 1.2) % 3 === 0
        if (pulseOn) {
          const halo = buffer.rows > 12
          if (halo) {
            buffer.put(node.col - 1, node.row, '·', { fg: C.GREEN_DEEP })
            buffer.put(node.col + 1, node.row, '·', { fg: C.GREEN_DEEP })
            buffer.put(node.col, node.row - 1, '·', { fg: C.GREEN_DEEP })
            buffer.put(node.col, node.row + 1, '·', { fg: C.GREEN_DEEP })
          }
        }
      }

      const label = `${nodeTeam.name}`
      const lx = node.col + 2
      if (lx + label.length < buffer.cols - 1 && !near) {
        buffer.write(lx, node.row, label, { fg: showcased ? C.GREEN_BRIGHT : C.FG_MUTED, bold: showcased })
        buffer.write(
          Math.min(lx + label.length + 1, buffer.cols - 4),
          node.row,
          `${nodeTeam.memberCount}⇡${nodeTeam.projectCount}`,
          { fg: C.FG_GHOST, dim: true }
        )
      }

      if (!reducedMotion) {
        const teamProjects = orbiters.filter((p) => p.teamId === nodeTeam.id)
        const speedBoost = near ? 2.2 : 1
        teamProjects.forEach((p, idx) => {
          const angle =
            time * speedBoost * (0.4 + (p.stars % 8) * 0.05) +
            (idx * Math.PI * 2) / Math.max(1, teamProjects.length) +
            hash(p.id) % 6
          const r = 3 + (hash(p.id) % 3)
          const ox = Math.round(node.col + Math.cos(angle) * r * 1.8)
          const oy = Math.round(node.row + Math.sin(angle) * r * 0.55)
          if (ox < 1 || ox >= buffer.cols - 1 || oy < 1 || oy >= buffer.rows - 2) return
          if (ox === node.col && oy === node.row) return
          buffer.put(ox, oy, ORBIT_GLYPH, { fg: p.isShowcased ? C.AMBER : C.FG_DIM })
        })
      }
    }

    if (hovered) this.drawHoverPanel(ctx, hovered)

    buffer.write(2, buffer.rows - 2, `◉ ${feed.teams.length} teams · ${feed.projects.length} projects · edges ${this.edges.length}`, {
      fg: C.FG_DIM,
      dim: true,
    })
  }
}

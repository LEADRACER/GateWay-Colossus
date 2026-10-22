import { C, type ColorIndex } from '@/lib/terminal/palette'
import type { TerminalFeedTeam } from '../types'
import { glyphs, type TerminalScene, type TerminalSceneCtx } from '../types'

const ORBIT_GLYPH = glyphs.orbit

interface PlacedNode {
  team: TerminalFeedTeam
  col: number
  row: number
}

function hash(str: string): number {
  let h = 0
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) | 0
  return Math.abs(h)
}

export class ConstellationScene implements TerminalScene {
  name = 'constellation'

  private placed: PlacedNode[] = []
  private edges: Array<{ a: PlacedNode; b: PlacedNode; weight: number }> = []
  private lastCols = 0
  private lastRows = 0

  reset(ctx: TerminalSceneCtx): void {
    this.layout(ctx)
  }

  private layout(ctx: TerminalSceneCtx): void {
    const { buffer, feed } = ctx
    if (buffer.cols === this.lastCols && buffer.rows === this.lastRows && this.placed.length) return
    this.lastCols = buffer.cols
    this.lastRows = buffer.rows
    this.placed = []
    this.edges = []
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

    const orbiters = feed.projects.filter((p) => p.teamId).slice(0, 40)

    for (const node of this.placed) {
      const nodeTeam = node.team
      const size = Math.min(2, 1 + Math.floor(nodeTeam.memberCount / 12))
      const showcased = nodeTeam.isShowcased
      const hue = hash(nodeTeam.name) % 3
      const nodeColor: ColorIndex = showcased ? C.GREEN_BRIGHT : hue === 0 ? C.GREEN : hue === 1 ? C.CYAN : C.BLUE

      const near = pointer.present && Math.abs(pointer.col - node.col) < 6 && Math.abs(pointer.row - node.row) < 3
      const ch = size > 1 ? glyphs.node : glyphs.node
      buffer.put(node.col, node.row, near ? glyphs.block : ch, {
        fg: near ? C.WHITE : nodeColor,
        bold: showcased,
      })
      const label = `${nodeTeam.name}`
      const lx = node.col + 2
      if (lx + label.length < buffer.cols - 1) {
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
        teamProjects.forEach((p, idx) => {
          const angle = time * (0.4 + (p.stars % 8) * 0.05) + idx * (Math.PI * 2) / Math.max(1, teamProjects.length) + hash(p.id) % 6
          const r = 3 + (hash(p.id) % 3)
          const ox = Math.round(node.col + Math.cos(angle) * r * 1.8)
          const oy = Math.round(node.row + Math.sin(angle) * r * 0.55)
          if (ox < 1 || ox >= buffer.cols - 1 || oy < 1 || oy >= buffer.rows - 2) return
          if (ox === node.col && oy === node.row) return
          buffer.put(ox, oy, ORBIT_GLYPH, { fg: p.isShowcased ? C.AMBER : C.FG_DIM })
        })
      }
    }

    buffer.write(2, buffer.rows - 2, `◉ ${feed.teams.length} teams · ${feed.projects.length} projects · edges ${this.edges.length}`, {
      fg: C.FG_DIM,
      dim: true,
    })
  }
}

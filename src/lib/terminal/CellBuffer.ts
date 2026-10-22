import { ATTR_BOLD, ATTR_DIM, C, type ColorIndex } from './palette'

export interface Cell {
  ch: string
  fg: ColorIndex
  bg: ColorIndex
  attrs: number
}

export interface WriteOpts {
  fg?: ColorIndex
  bg?: ColorIndex
  bold?: boolean
  dim?: boolean
}

const BG_COLOR: ColorIndex = 0

export class CellBuffer {
  readonly cols: number
  readonly rows: number

  chars: string[]
  fg: Uint8Array
  bg: Uint8Array
  attrs: Uint8Array

  constructor(cols: number, rows: number) {
    this.cols = Math.max(1, Math.floor(cols))
    this.rows = Math.max(1, Math.floor(rows))
    this.chars = new Array(this.cols * this.rows).fill('')
    this.fg = new Uint8Array(this.cols * this.rows).fill(C.FG)
    this.bg = new Uint8Array(this.cols * this.rows)
    this.attrs = new Uint8Array(this.cols * this.rows)
  }

  get size(): number {
    return this.cols * this.rows
  }

  clear(): void {
    this.chars.fill('')
    this.fg.fill(C.FG)
    this.bg.fill(BG_COLOR)
    this.attrs.fill(0)
  }

  private idx(x: number, y: number): number {
    return y * this.cols + x
  }

  inBounds(x: number, y: number): boolean {
    return x >= 0 && x < this.cols && y >= 0 && y < this.rows
  }

  get(x: number, y: number): Cell {
    const i = this.idx(x, y)
    return { ch: this.chars[i], fg: this.fg[i] as ColorIndex, bg: this.bg[i] as ColorIndex, attrs: this.attrs[i] }
  }

  set(x: number, y: number, cell: Partial<Cell>): void {
    if (!this.inBounds(x, y)) return
    const i = this.idx(x, y)
    this.chars[i] = cell.ch ?? this.chars[i]
    if (cell.fg !== undefined) this.fg[i] = cell.fg
    if (cell.bg !== undefined) this.bg[i] = cell.bg
    if (cell.attrs !== undefined) this.attrs[i] = cell.attrs
  }

  setAttrs(x: number, y: number, bold: boolean, dim: boolean): void {
    if (!this.inBounds(x, y)) return
    this.attrs[this.idx(x, y)] = (bold ? ATTR_BOLD : 0) | (dim ? ATTR_DIM : 0)
  }

  fillRegion(x0: number, y0: number, w: number, h: number, ch: string, opts: WriteOpts = {}): void {
    const x1 = Math.min(this.cols, x0 + w)
    const y1 = Math.min(this.rows, y0 + h)
    for (let y = Math.max(0, y0); y < y1; y++) {
      for (let x = Math.max(0, x0); x < x1; x++) {
        this.set(x, y, { ch, fg: opts.fg, bg: opts.bg })
        this.setAttrs(x, y, !!opts.bold, !!opts.dim)
      }
    }
  }

  put(x: number, y: number, ch: string, opts: WriteOpts = {}): void {
    this.set(x, y, { ch })
    if (opts.fg !== undefined) this.set(x, y, { fg: opts.fg })
    if (opts.bg !== undefined) this.set(x, y, { bg: opts.bg })
    this.setAttrs(x, y, !!opts.bold, !!opts.dim)
  }

  write(x: number, y: number, str: string, opts: WriteOpts = {}): number {
    const n = str.length
    for (let i = 0; i < n; i++) {
      const cx = x + i
      if (cx >= this.cols) break
      this.put(cx, y, str[i], opts)
    }
    return Math.min(x + n, this.cols)
  }

  writeWrapped(x: number, y: number, width: number, str: string, opts: WriteOpts = {}): number {
    const lineW = Math.max(1, width - x)
    let cy = y
    let i = 0
    while (i < str.length && cy < this.rows) {
      this.write(x, cy, str.slice(i, i + lineW), opts)
      i += lineW
      cy++
    }
    return cy
  }

  centerWrite(y: number, str: string, opts: WriteOpts = {}): void {
    const x = Math.max(0, Math.floor((this.cols - str.length) / 2))
    this.write(x, y, str, opts)
  }

  rightWrite(y: number, str: string, pad = 0, opts: WriteOpts = {}): void {
    const x = Math.max(0, this.cols - str.length - pad)
    this.write(x, y, str, opts)
  }

  hline(x0: number, y: number, len: number, ch: string, opts: WriteOpts = {}): void {
    this.fillRegion(x0, y, len, 1, ch, opts)
  }

  box(x: number, y: number, w: number, h: number, opts: WriteOpts = {}): void {
    if (w < 2 || h < 2) return
    this.put(x, y, '┌', opts)
    this.put(x + w - 1, y, '┐', opts)
    this.put(x, y + h - 1, '└', opts)
    this.put(x + w - 1, y + h - 1, '┘', opts)
    for (let i = 1; i < w - 1; i++) {
      this.put(x + i, y, '─', opts)
      this.put(x + i, y + h - 1, '─', opts)
    }
    for (let j = 1; j < h - 1; j++) {
      this.put(x, y + j, '│', opts)
      this.put(x + w - 1, y + j, '│', opts)
    }
  }

  segment(x0: number, y0: number, segs: Array<{ text: string; fg?: ColorIndex; bold?: boolean; dim?: boolean }>, opts: WriteOpts = {}): number {
    let cx = x0
    for (const seg of segs) {
      cx = this.write(cx, y0, seg.text, {
        ...opts,
        fg: seg.fg ?? opts.fg,
        bold: seg.bold ?? opts.bold,
        dim: seg.dim ?? opts.dim,
      })
      if (cx >= this.cols) break
    }
    return cx
  }
}

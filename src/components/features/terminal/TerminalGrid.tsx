'use client'

import { useEffect, useRef } from 'react'
import { CellBuffer } from '@/lib/terminal/CellBuffer'
import { C, PAL } from '@/lib/terminal/palette'
import { useTerminalFeed } from '@/hooks/useTerminalFeed'
import { useTerminalEvents } from '@/hooks/useTerminalEvents'
import { SHELL } from '@/components/shell/constants'
import { hydrateTerminalEvents } from './events'
import { setActiveScene, subscribeRequestedScene, syncUrlScene } from './sceneBus'
import type { TerminalFeed, TerminalPointer, TerminalScene, TerminalSceneCtx } from './types'
import { BootScene } from './scenes/BootScene'
import { RainScene } from './scenes/RainScene'
import { ConstellationScene } from './scenes/ConstellationScene'
import { TickerScene } from './scenes/TickerScene'

const SCENES: TerminalScene[] = [new BootScene(), new RainScene(), new ConstellationScene(), new TickerScene()]
const ROTATION: string[] = ['rain', 'constellation', 'ticker']
const SCENE_DURATION = 16

const FONT_STACK = '"Geist Mono", "JetBrains Mono", "Fira Code", ui-monospace, monospace'
const FONT_SIZE_DESKTOP = 15
const FONT_SIZE_MOBILE = 12

interface Metrics {
  charW: number
  cellH: number
  cols: number
  rows: number
  originX: number
  originY: number
  fontSize: number
  dpr: number
}

function bootScene(
  map: Map<string, TerminalScene>,
  name: string,
  buffer: CellBuffer,
  feed: TerminalFeed | null,
  pointer: TerminalPointer,
  reducedMotion: boolean,
): TerminalScene | null {
  const next = map.get(name)
  if (!next) return null
  const ctx: TerminalSceneCtx = {
    buffer,
    feed,
    time: 0,
    dt: 0,
    pointer,
    reducedMotion,
    requestSwitch: () => {},
  }
  next.reset(ctx)
  return next
}

export function TerminalGrid() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const { feed } = useTerminalFeed()
  const feedRef = useRef<TerminalFeed | null>(null)

  useEffect(() => {
    feedRef.current = feed
    if (feed?.events?.length) hydrateTerminalEvents(feed.events)
  }, [feed])

  useTerminalEvents()

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let cancelled = false
    let raf = 0
    let metrics: Metrics = { charW: 9, cellH: 21, cols: 0, rows: 0, originX: 0, originY: 0, fontSize: FONT_SIZE_DESKTOP, dpr: 1 }
    const pointer: TerminalPointer = { col: 0, row: 0, present: false }
    const sceneMap = new Map(SCENES.map((s) => [s.name, s]))
    let currentScene: TerminalScene | null = null
    let sceneTime = 0
    let lastFrame = performance.now()
    let reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    const measure = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      const vw = window.innerWidth
      const vh = window.innerHeight
      const fontSize = vw < 768 ? FONT_SIZE_MOBILE : FONT_SIZE_DESKTOP
      canvas.width = vw * dpr
      canvas.height = vh * dpr
      canvas.style.width = `${vw}px`
      canvas.style.height = `${vh}px`
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.font = `600 ${fontSize}px ${FONT_STACK}`
      ctx.textBaseline = 'top'
      const charW = ctx.measureText('M').width
      const cellH = Math.round(fontSize * 1.35)
      const topInset = SHELL.TOP_INSET
      const bottomInset = SHELL.BOTTOM_INSET
      const cols = Math.max(24, Math.floor((vw - 8) / charW))
      const rows = Math.max(14, Math.floor((vh - topInset - bottomInset - 8) / cellH))
      metrics = {
        charW,
        cellH,
        cols,
        rows,
        originX: Math.floor((vw - cols * charW) / 2),
        originY: topInset + Math.floor((vh - topInset - bottomInset - rows * cellH) / 2),
        fontSize,
        dpr,
      }
      ctx.fillStyle = PAL[C.BG]
      ctx.fillRect(0, 0, canvas.width, canvas.height)
    }

    const resetScene = (name: string) => {
      const buffer = new CellBuffer(metrics.cols, metrics.rows)
      const next = bootScene(sceneMap, name, buffer, feedRef.current, pointer, reducedMotion)
      if (next) {
        currentScene = next
        sceneTime = 0
        setActiveScene(next.name)
      }
    }

    const switchScene = (name: string) => {
      if (!sceneMap.has(name)) return
      currentScene?.destroy?.()
      resetScene(name)
      syncUrlScene(name)
    }

    const advanceScene = () => {
      const from = currentScene?.name
      if (!from || from === 'boot') return
      const idx = ROTATION.indexOf(from)
      const nextName = ROTATION[(idx + 1 + ROTATION.length) % ROTATION.length] ?? 'rain'
      switchScene(nextName)
    }

    measure()
    const params = new URLSearchParams(window.location.search)
    const requested = params.get('scene')
    let initialScene = requested
    if (!requested || requested === 'boot') {
      try {
        initialScene = sessionStorage.getItem('gw-boot-seen') ? 'rain' : 'boot'
        sessionStorage.setItem('gw-boot-seen', '1')
      } catch {
        initialScene = 'boot'
      }
    }
    resetScene(initialScene ?? 'boot')

    const unsubRequested = subscribeRequestedScene((name) => {
      if (!cancelled && name !== currentScene?.name) switchScene(name)
    })

    const drawChrome = (buffer: CellBuffer, sceneName: string, now: Date) => {
      const time = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`
      const meta = feedRef.current?.metadata
      const feedStats = meta ? `${meta.totalProjects}·${meta.totalTeams}` : '--·--'
      buffer.write(1, 0, 'GATEWAY:COLOSSUS', { fg: C.GREEN_DEEP, bold: true })
      buffer.write(18, 0, `[${sceneName}]`, { fg: C.FG_DIM })
      buffer.hline(18 + sceneName.length + 2, 0, Math.max(0, buffer.cols - (18 + sceneName.length + 2) - (time.length + 5)), '─', { fg: C.FG_GHOST })
      buffer.write(buffer.cols - time.length - feedStats.length - 3, 0, feedStats, { fg: C.FG_GHOST, dim: true })
      buffer.write(buffer.cols - time.length - 1, 0, time, { fg: C.FG_MUTED, bold: true })
    }

    const frame = (now: number) => {
      if (cancelled) return
      raf = requestAnimationFrame(frame)
      const dt = Math.min(0.05, (now - lastFrame) / 1000)
      lastFrame = now
      sceneTime += dt
      const wall = new Date(now)
      ctx.font = `600 ${metrics.fontSize}px ${FONT_STACK}`
      ctx.textBaseline = 'top'
      const buffer = new CellBuffer(metrics.cols, metrics.rows)
      if (currentScene && currentScene.name !== 'boot' && sceneTime > SCENE_DURATION) {
        advanceScene()
      }
      const target: TerminalSceneCtx = {
        buffer,
        feed: feedRef.current,
        time: sceneTime,
        dt,
        pointer,
        reducedMotion,
        requestSwitch: (name: string) => {
          if (name && name !== currentScene?.name) {
            switchScene(name)
          }
        },
      }
      currentScene?.update(target)

      drawChrome(buffer, currentScene?.name ?? 'boot', wall)

      const { originX, originY, cellH, cols, rows } = metrics
      // Full clear + full redraw every frame. A dirty-cell diff cache is not
      // viable here: wide glyphs (★ █ ─ ♥) and descenders bleed past their cell
      // rect, so skipped cells would leave permanent ink smears across scene
      // switches. Background is uniform, so one fillRect wipes everything.
      ctx.fillStyle = PAL[C.BG]
      ctx.fillRect(0, 0, canvas.width / metrics.dpr, canvas.height / metrics.dpr)

      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          const i = y * cols + x
          const ch = buffer.chars[i]
          if (!ch || ch === ' ') continue
          const px = originX + Math.round(x * metrics.charW)
          const py = originY + y * cellH
          const cellBg = buffer.bg[i]
          if (cellBg !== C.BG) {
            ctx.fillStyle = PAL[cellBg] ?? PAL[C.BG]
            ctx.fillRect(px - 1, py, Math.ceil(metrics.charW) + 1, cellH)
          }
          ctx.fillStyle = PAL[buffer.fg[i]] ?? PAL[C.FG]
          ctx.fillText(ch, px, py + 2)
        }
      }
    }
    raf = requestAnimationFrame(frame)

    const onPointerMove = (e: PointerEvent) => {
      pointer.present = true
      pointer.col = Math.floor((e.clientX - metrics.originX) / metrics.charW)
      pointer.row = Math.floor((e.clientY - metrics.originY) / metrics.cellH)
    }
    const onPointerLeave = () => {
      pointer.present = false
    }
    const onPointerDown = () => {
      if (currentScene?.name === 'boot' && sceneTime > 0.5) {
        resetScene('rain')
      }
    }
    const onResize = () => {
      measure()
      resetScene(currentScene?.name ?? 'boot')
    }
    const onMotionPref = (e: MediaQueryListEvent) => {
      reducedMotion = e.matches
      resetScene(currentScene?.name ?? 'boot')
    }

    window.addEventListener('pointermove', onPointerMove, { passive: true })
    window.addEventListener('pointerdown', onPointerDown, { passive: true })
    window.addEventListener('resize', onResize)
    const reducedQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    reducedQuery.addEventListener('change', onMotionPref)
    canvas.addEventListener('pointerleave', onPointerLeave)

    const fontsReady = document.fonts?.ready
    if (fontsReady) fontsReady.then(() => !cancelled && onResize())

    return () => {
      cancelled = true
      cancelAnimationFrame(raf)
      window.removeEventListener('pointermove', onPointerMove)
      window.removeEventListener('pointerdown', onPointerDown)
      window.removeEventListener('resize', onResize)
      reducedQuery.removeEventListener('change', onMotionPref)
      canvas.removeEventListener('pointerleave', onPointerLeave)
      unsubRequested()
    }
  }, [])

  return (
    <div
      className="fixed inset-0 -z-10 bg-bg"
      aria-hidden="true"
      style={{ touchAction: 'none' }}
    >
      <canvas ref={canvasRef} className="block h-full w-full" />
      <div
        className="pointer-events-none absolute inset-0 z-10 opacity-20"
        style={{
          background:
            'repeating-linear-gradient(0deg, rgba(0,0,0,0.28) 0px, rgba(0,0,0,0.28) 1px, transparent 1px, transparent 3px)',
        }}
      />
      <div
        className="pointer-events-none absolute inset-0 z-10"
        style={{
          background: 'radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,0.55) 100%)',
        }}
      />
    </div>
  )
}

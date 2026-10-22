'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import {
  FolderOpen,
  Flame,
  Network,
  Bookmark,
  Plus,
  Terminal,
  ShieldCheck,
  UserRound,
} from 'lucide-react'
import { overlayPanel, overlayScrim, spring } from '@/components/motion/variants'
import { requestScene, type SceneName } from '@/components/features/terminal/sceneBus'
import { useSupabaseSession } from '@/hooks/useSupabaseSession'

interface Command {
  id: string
  label: string
  hint?: string
  href?: string
  icon: React.ComponentType<{ className?: string }>
  keywords?: string
}

export function CommandPalette() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [cursor, setCursor] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const { data: session, status } = useSupabaseSession()
  const reduced = useReducedMotion()

  const commands = useMemo<Command[]>(() => {
    const all: Command[] = [
      { id: 'projects', label: 'projects', hint: 'browse the full index', href: '/projects', icon: FolderOpen, keywords: 'grid all list' },
      { id: 'trending', label: 'trending', hint: 'most starred this week', href: '/trending', icon: Flame, keywords: 'hot stars popular' },
      { id: 'teams', label: 'teams', hint: 'open the constellation', href: '/teams', icon: Network, keywords: 'crew squad constellation map' },
      { id: 'bookmarks', label: 'bookmarks', hint: 'your saved shelf', href: '/bookmarks', icon: Bookmark, keywords: 'saved saved ' },
      { id: 'new-project', label: 'new project', hint: 'showcase your work', href: '/projects/new', icon: Plus, keywords: 'add submit create' },
      { id: 'profile', label: 'profile', hint: status === 'authenticated' && session?.user?.githubLogin ? `@${session.user.githubLogin}` : 'sign in to view', href: '/profile', icon: UserRound, keywords: 'me account' },
      { id: 'scene-rain', label: 'scene: rain', hint: 'matrix rain', icon: Terminal, keywords: 'switch scene bg rain' },
      { id: 'scene-constellation', label: 'scene: constellation', hint: 'team map', icon: Terminal, keywords: 'switch scene map constellation' },
      { id: 'scene-ticker', label: 'scene: ticker', hint: 'star ticker', icon: Terminal, keywords: 'switch scene ticker' },
    ]
    if (status === 'authenticated' && session?.user?.role === 'admin') {
      all.push({ id: 'admin', label: 'admin', hint: 'console', href: '/admin', icon: ShieldCheck, keywords: 'moderation backstage root' })
    }
    return all
  }, [status, session])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return commands
    return commands.filter((c) =>
      `${c.label} ${c.hint ?? ''} ${c.keywords ?? ''}`.toLowerCase().includes(q)
    )
  }, [commands, query])

  const close = useCallback(() => {
    setOpen(false)
    setQuery('')
    setCursor(0)
  }, [])

  const run = useCallback((c: Command) => {
    close()
    if (c.id.startsWith('scene-')) {
      requestScene(c.id.slice('scene-'.length) as SceneName)
      return
    }
    if (c.href) router.push(c.href)
  }, [close, router])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setOpen((o) => !o)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  useEffect(() => {
    if (!open) return
    inputRef.current?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.preventDefault(); close() }
      if (e.key === 'ArrowDown') { e.preventDefault(); setCursor((c) => Math.min(c + 1, filtered.length - 1)) }
      if (e.key === 'ArrowUp') { e.preventDefault(); setCursor((c) => Math.max(c - 1, 0)) }
      if (e.key === 'Enter' && filtered[cursor]) { e.preventDefault(); run(filtered[cursor]) }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, filtered, cursor, close, run])

  useEffect(() => {
    const el = listRef.current?.querySelector('[data-active="true"]')
    el?.scrollIntoView({ block: 'nearest' })
  }, [cursor, open])

  if (typeof window === 'undefined') return null

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-[18vh] px-4" role="dialog" aria-label="command palette">
          <motion.div
            variants={overlayScrim}
            initial="hidden"
            animate="show"
            exit="hidden"
            transition={{ duration: 0.18 }}
            className="absolute inset-0 bg-black/70 backdrop-blur-[2px]"
            onClick={close}
          />
          <motion.div
            variants={reduced ? undefined : overlayPanel}
            initial="hidden"
            animate="show"
            exit="hidden"
            transition={spring}
            className="relative z-10 w-full max-w-xl rounded-none border border-border bg-bg-raised shadow-2xl"
          >
            <div className="flex items-center gap-3 border-b border-border px-4 h-12">
              <span className="font-mono text-gold select-none">›</span>
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => { setQuery(e.target.value); setCursor(0) }}
                placeholder="search the gateway…"
                className="flex-1 bg-transparent font-mono text-sm text-text placeholder:text-text-dim focus:outline-none"
              />
              <kbd className="font-mono text-[10px] text-text-dim border border-border px-1.5 py-0.5">esc</kbd>
            </div>
            <div ref={listRef} className="max-h-80 overflow-y-auto py-2">
              {filtered.length === 0 ? (
                <div className="px-4 py-6 font-mono text-xs text-text-dim">
                  no match — try another signal
                </div>
              ) : (
                filtered.map((c, i) => (
                  <button
                    key={c.id}
                    data-active={i === cursor}
                    onMouseMove={() => setCursor(i)}
                    onClick={() => run(c)}
                    className={`flex w-full items-center gap-3 px-4 py-2.5 text-left font-mono text-xs cursor-pointer transition-colors ${
                      i === cursor ? 'bg-surface-hover text-green-bright' : 'text-text-muted'
                    }`}
                  >
                    <c.icon className={`w-3.5 h-3.5 shrink-0 ${i === cursor ? 'text-gold' : 'text-text-dim'}`} />
                    <span className="shrink-0">{c.label}</span>
                    {c.hint && <span className="ml-auto text-[11px] text-text-dim truncate">{c.hint}</span>}
                  </button>
                ))
              )}
            </div>
            <div className="flex items-center gap-4 border-t border-border px-4 h-8 font-mono text-[10px] text-text-dim">
              <span>↑↓ navigate</span>
              <span>↵ open</span>
              <span className="ml-auto">gw:palette</span>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

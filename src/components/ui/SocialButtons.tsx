'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import type { Project } from '@/lib/types/database'

interface LikeButtonProps {
  project: Project
  onCountChange?: (count: number) => void
  size?: 'sm' | 'md'
}

export function LikeButton({ project, onCountChange, size = 'md' }: LikeButtonProps) {
  const { data: session } = useSession()
  const [liked, setLiked] = useState(false)
  const [count, setCount] = useState(project.like_count ?? 0)
  const [loading, setLoading] = useState(false)

  const iconSize = size === 'sm' ? 14 : 16

  useEffect(() => {
    if (!session?.user?.githubId) return
    const checkLike = async () => {
      try {
        const response = await fetch(`/api/projects/${project.id}/like/status`)
        if (response.ok) {
          const data = await response.json()
          setLiked(data.liked)
        }
      } catch {
        // silently fail
      }
    }
    checkLike()
  }, [project.id, session?.user?.githubId])

  async function handleToggle() {
    if (!session?.user) return
    setLoading(true)
    try {
      const response = await fetch(`/api/projects/${project.id}/like`, {
        method: liked ? 'DELETE' : 'POST',
      })
      if (!response.ok) throw new Error('Failed')
      
      if (liked) {
        setLiked(false)
        setCount(c => c - 1)
        onCountChange?.(count - 1)
      } else {
        setLiked(true)
        setCount(c => c + 1)
        onCountChange?.(count + 1)
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleToggle}
      disabled={loading || !session?.user}
      className={`inline-flex items-center gap-1.5 rounded-lg transition-all duration-150 ${
        size === 'sm' ? 'px-2 py-1 text-xs' : 'px-3 py-1.5 text-sm'
      } ${
        liked
          ? 'bg-error/10 text-error'
          : 'bg-surface-alt text-text-dim hover:text-text-muted border border-transparent hover:border-border'
      } ${!session?.user ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      <svg
        width={iconSize}
        height={iconSize}
        viewBox="0 0 24 24"
        fill={liked ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
      </svg>
      {count > 0 && <span className="font-medium">{count}</span>}
    </button>
  )
}

interface BookmarkButtonProps {
  project: Project
  size?: 'sm' | 'md'
}

export function BookmarkButton({ project, size = 'md' }: BookmarkButtonProps) {
  const { data: session } = useSession()
  const [bookmarked, setBookmarked] = useState(false)
  const [count, setCount] = useState(project.bookmark_count ?? 0)
  const [loading, setLoading] = useState(false)

  const iconSize = size === 'sm' ? 14 : 16

  useEffect(() => {
    if (!session?.user?.githubId) return
    const check = async () => {
      try {
        const response = await fetch(`/api/projects/${project.id}/bookmark/status`)
        if (response.ok) {
          const data = await response.json()
          setBookmarked(data.bookmarked)
        }
      } catch {
        // silently fail
      }
    }
    check()
  }, [project.id, session?.user?.githubId])

  async function handleToggle() {
    if (!session?.user) return
    setLoading(true)
    try {
      const response = await fetch(`/api/projects/${project.id}/bookmark`, {
        method: bookmarked ? 'DELETE' : 'POST',
      })
      if (!response.ok) throw new Error('Failed')
      
      if (bookmarked) {
        setBookmarked(false)
        setCount(c => Math.max(0, c - 1))
      } else {
        setBookmarked(true)
        setCount(c => c + 1)
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleToggle}
      disabled={loading || !session?.user}
      className={`inline-flex items-center gap-1.5 rounded-lg transition-all duration-150 ${
        size === 'sm' ? 'px-2 py-1 text-xs' : 'px-3 py-1.5 text-sm'
      } ${
        bookmarked
          ? 'bg-warning/10 text-warning'
          : 'bg-surface-alt text-text-dim hover:text-text-muted border border-transparent hover:border-border'
      } ${!session?.user ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      <svg
        width={iconSize}
        height={iconSize}
        viewBox="0 0 24 24"
        fill={bookmarked ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
      </svg>
      {count > 0 && <span className="font-medium">{count}</span>}
    </button>
  )
}
'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { likeProject, unlikeProject, getLikeCount } from '@/services/social'
import type { Project } from '@/lib/types/database'

interface LikeButtonProps {
  project: Project
  onCountChange?: (count: number) => void
  size?: 'sm' | 'md'
}

export function LikeButton({ project, onCountChange, size = 'md' }: LikeButtonProps) {
  const [liked, setLiked] = useState(false)
  const [count, setCount] = useState(project.like_count ?? 0)
  const [loading, setLoading] = useState(false)

  const iconSize = size === 'sm' ? 14 : 16

  useEffect(() => {
    setCount(project.like_count ?? 0)
    // Check if current user has liked
    const checkLike = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase
        .from('likes')
        .select('id')
        .eq('project_id', project.id)
        .eq('user_id', user.id)
        .single()
      setLiked(!!data)
    }
    checkLike()
  }, [project.id, project.like_count])

  async function handleToggle() {
    setLoading(true)
    try {
      const supabase = createClient()
      if (liked) {
        await unlikeProject(supabase, project.id)
        setLiked(false)
        setCount(c => c - 1)
        onCountChange?.(count - 1)
      } else {
        await likeProject(supabase, project.id)
        setLiked(true)
        setCount(c => c + 1)
        onCountChange?.(count + 1)
      }
    } catch (e: any) {
      // silently fail
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleToggle}
      disabled={loading}
      className={`inline-flex items-center gap-1.5 rounded-lg transition-all duration-150 ${
        size === 'sm' ? 'px-2 py-1 text-xs' : 'px-3 py-1.5 text-sm'
      } ${
        liked
          ? 'bg-error/10 text-error'
          : 'bg-surface-alt text-text-dim hover:text-text-muted border border-transparent hover:border-border'
      }`}
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
  const [bookmarked, setBookmarked] = useState(false)
  const [count, setCount] = useState(project.bookmark_count ?? 0)
  const [loading, setLoading] = useState(false)

  const iconSize = size === 'sm' ? 14 : 16

  useEffect(() => {
    setCount(project.bookmark_count ?? 0)
    const check = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase
        .from('bookmarks')
        .select('id')
        .eq('project_id', project.id)
        .eq('user_id', user.id)
        .single()
      setBookmarked(!!data)
    }
    check()
  }, [project.id, project.bookmark_count])

  async function handleToggle() {
    setLoading(true)
    try {
      const supabase = createClient()
      const { bookmarkProject, unbookmarkProject } = await import('@/services/social')
      if (bookmarked) {
        await unbookmarkProject(supabase, project.id)
        setBookmarked(false)
        setCount(c => Math.max(0, c - 1))
      } else {
        await bookmarkProject(supabase, project.id)
        setBookmarked(true)
        setCount(c => c + 1)
      }
    } catch (e: any) {
      // silently fail
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleToggle}
      disabled={loading}
      className={`inline-flex items-center gap-1.5 rounded-lg transition-all duration-150 ${
        size === 'sm' ? 'px-2 py-1 text-xs' : 'px-3 py-1.5 text-sm'
      } ${
        bookmarked
          ? 'bg-warning/10 text-warning'
          : 'bg-surface-alt text-text-dim hover:text-text-muted border border-transparent hover:border-border'
      }`}
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

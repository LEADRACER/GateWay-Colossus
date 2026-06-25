'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { addComment, getComments, deleteComment, getCommentCount } from '@/services/social'
import type { Comment } from '@/lib/types/database'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'

interface CommentsSectionProps {
  projectId: string
  onCountChange?: (count: number) => void
}

export function CommentsSection({ projectId, onCountChange }: CommentsSectionProps) {
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(true)
  const [content, setContent] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    loadComments()
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null))
  }, [projectId])

  async function loadComments() {
    setLoading(true)
    try {
      const supabase = createClient()
      const data = await getComments(supabase, projectId)
      // Enrich with profile data
      const enriched = await Promise.all(
        data.map(async (c) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('username, avatar_url')
            .eq('id', c.user_id)
            .single()
          return { ...c, username: profile?.username || c.user_id.slice(0, 8), avatar_url: profile?.avatar_url }
        })
      )
      setComments(enriched)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!content.trim()) return
    setSubmitting(true)
    setError('')
    try {
      const supabase = createClient()
      await addComment(supabase, projectId, content.trim())
      setContent('')
      await loadComments()
      const count = await getCommentCount(supabase, projectId)
      onCountChange?.(count)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete(commentId: string) {
    try {
      const supabase = createClient()
      await deleteComment(supabase, commentId)
      await loadComments()
      const count = await getCommentCount(supabase, projectId)
      onCountChange?.(count)
    } catch (e: any) {
      setError(e.message)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner />
      </div>
    )
  }

  return (
    <div className="mt-8 pt-6 border-t border-border">
      <h3 className="text-lg font-semibold text-text mb-4">
        Comments ({comments.length})
      </h3>

      {/* Comment form */}
      <form onSubmit={handleSubmit} className="mb-6">
        <div className="flex gap-3">
          <div className="w-8 h-8 rounded-full bg-surface-alt flex items-center justify-center shrink-0">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-text-dim">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          </div>
          <div className="flex-1">
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Share your thoughts on this project..."
              rows={3}
              maxLength={2000}
              className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-surface-alt text-text placeholder:text-text-dim/50 focus:outline-none focus:border-accent/50 resize-none transition-colors"
            />
            <div className="flex items-center justify-between mt-2">
              <span className="text-xs text-text-dim">{content.length}/2000</span>
              <Button type="submit" size="sm" disabled={!content.trim() || submitting} loading={submitting}>
                Post Comment
              </Button>
            </div>
            {error && <p className="text-xs text-error mt-1">{error}</p>}
          </div>
        </div>
      </form>

      {/* Comments list */}
      {comments.length === 0 ? (
        <p className="text-sm text-text-dim text-center py-8">
          No comments yet. Be the first to share your thoughts!
        </p>
      ) : (
        <div className="space-y-4">
          {comments.map((comment) => (
            <div key={comment.id} className="flex gap-3 group">
              <div className="w-8 h-8 rounded-full bg-surface-alt flex items-center justify-center shrink-0 overflow-hidden">
                {comment.avatar_url ? (
                  <img src={comment.avatar_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-text-dim">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-text">{comment.username || 'Anonymous'}</span>
                  <span className="text-xs text-text-dim">
                    {new Date(comment.created_at).toLocaleDateString(undefined, {
                      month: 'short', day: 'numeric', year: 'numeric'
                    })}
                  </span>
                  {userId === comment.user_id && (
                    <button
                      onClick={() => handleDelete(comment.id)}
                      className="ml-auto text-xs text-text-dim hover:text-error opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      Delete
                    </button>
                  )}
                </div>
                <p className="text-sm text-text-muted mt-0.5 leading-relaxed whitespace-pre-wrap">{comment.content}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

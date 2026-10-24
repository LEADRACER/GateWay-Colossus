'use client'

import Link from 'next/link'
import { useSupabaseSession, supabaseSignOut } from '@/hooks/useSupabaseSession'
import { Button } from '@/components/ui/Button'
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from '@/components/ui/DropdownMenu'
import { GithubIcon } from '@/components/ui/GithubIcon'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/Avatar'

export function UserMenu() {
  const { data: session, status } = useSupabaseSession()

  if (status === 'loading') {
    return (
      <div className="h-8 w-8 rounded-full border border-border border-t-accent animate-spin" />
    )
  }

  if (!session?.user) {
    return (
      <a href="/auth/signin" className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm text-text-muted hover:text-text hover:bg-surface-alt rounded-md transition-colors">
        Sign In
      </a>
    )
  }

  const { githubLogin, avatarUrl } = session.user
  // github headers may be absent if the oauth step was skipped; don't render a
  // broken github.com/<empty> link or "@undefined" in that case
  const login = githubLogin || session.user.id.slice(0, 8)
  const hasGithub = Boolean(githubLogin) && Boolean(avatarUrl)

  return (
    <DropdownMenu>
      <DropdownMenuTrigger>
        <Button variant="ghost" size="sm" className="gap-1.5 h-8 px-2">
          <Avatar className="h-8 w-8">
            <AvatarImage src={avatarUrl ?? undefined} alt={login} />
            <AvatarFallback>
              <GithubIcon className="w-4 h-4" />
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent sideOffset={8} className="w-48">
        <div className="px-3 py-2 border-b border-border">
          <p className="text-sm font-medium text-text">{login}</p>
          <p className="text-xs text-text-dim">{hasGithub ? `@${githubLogin}` : 'signed in'}</p>
        </div>
        {hasGithub && (
          <DropdownMenuItem>
            <a href={`https://github.com/${githubLogin}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2">
              <GithubIcon className="w-4 h-4" />
              View GitHub Profile
            </a>
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem>
          <Link href="/projects/new" className="flex items-center gap-2">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Add Project
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem>
          <Link href="/bookmarks" className="flex items-center gap-2">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
            </svg>
            Bookmarks
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => supabaseSignOut('/')} className="text-error">
          Sign Out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { isAdmin } from '@/services/admin'
import type { Profile } from '@/lib/types/database'

const adminNav = [
  { href: '/admin', label: 'Dashboard', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
  { href: '/admin/moderation', label: 'Moderation', icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' },
  { href: '/admin/users', label: 'Users', icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z' },
  { href: '/admin/categories', label: 'Categories', icon: 'M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z' },
  { href: '/admin/settings', label: 'Settings', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z' },
]

interface AdminLayoutProps {
  children: React.ReactNode
  profile: Profile
}

export default function AdminLayout({ children, profile }: AdminLayoutProps) {
  const pathname = usePathname()
  const router = useRouter()

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside style={{
        width: 220,
        background: 'var(--color-surface)',
        borderRight: '1px solid var(--color-border)',
        display: 'flex',
        flexDirection: 'column',
        position: 'sticky',
        top: 0,
        height: '100vh',
        flexShrink: 0,
      }}>
        {/* Logo */}
        <div style={{
          padding: '20px 16px',
          borderBottom: '1px solid var(--color-border)',
        }}>
          <Link href="/admin" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{
              width: 28, height: 28, borderRadius: 7,
              background: 'var(--color-accent-bg)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--color-accent)' }}>
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
            </div>
            <span style={{ fontWeight: 600, fontSize: 14, color: 'var(--color-text)' }}>
              Admin
            </span>
          </Link>
        </div>

        {/* Nav */}
        <nav style={{ padding: '8px 6px', flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
          {adminNav.map((item) => {
            const active = pathname === item.href || (item.href !== '/admin' && pathname?.startsWith(item.href))
            return (
              <Link key={item.href} href={item.href}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '9px 10px', borderRadius: 6,
                  background: active ? 'var(--color-accent-bg)' : 'transparent',
                  color: active ? 'var(--color-accent)' : 'var(--color-text-muted)',
                  fontSize: 13, fontWeight: active ? 500 : 400,
                  transition: 'all 0.12s',
                  textDecoration: 'none',
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d={item.icon} />
                </svg>
                {item.label}
              </Link>
            )
          })}
        </nav>

        {/* Back to site */}
        <div style={{ padding: '10px 14px', borderTop: '1px solid var(--color-border)' }}>
          <Link href="/projects" style={{
            display: 'flex', alignItems: 'center', gap: 6,
            fontSize: 12, color: 'var(--color-text-dim)',
            textDecoration: 'none',
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            Back to Site
          </Link>
        </div>
      </aside>

      {/* Main */}
      <main style={{ flex: 1, overflow: 'auto' }}>
        {/* Top bar */}
        <div style={{
          padding: '16px 24px',
          borderBottom: '1px solid var(--color-border)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: 'var(--color-surface)',
          position: 'sticky', top: 0, zIndex: 10,
        }}>
          <h1 style={{ fontSize: 18, fontWeight: 600, color: 'var(--color-text)', margin: 0 }}>
            {adminNav.find(n => n.href === pathname || (n.href !== '/admin' && pathname?.startsWith(n.href)))?.label || 'Admin'}
          </h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 12, color: 'var(--color-text-dim)' }}>
              {profile.username} · <span style={{ color: 'var(--color-accent)', fontWeight: 500 }}>Admin</span>
            </span>
            <div style={{
              width: 32, height: 32, borderRadius: '50%',
              background: 'var(--color-accent-bg)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: 'var(--color-accent)' }}>
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </div>
          </div>
        </div>

        {/* Content */}
        <div style={{ padding: 24 }}>
          {children}
        </div>
      </main>
    </div>
  )
}

'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

// Dev-only placeholder: no live TTY is embedded anymore.
// Kept so the footer link stays valid; bounces to home + opens the terminal boot scene.
export default function DevTty() {
  const router = useRouter()

  useEffect(() => { router.replace('/') }, [router])

  return null
}

const attempts = new Map<string, { count: number; resetAt: number }>()

const WINDOW_MS = 60_000
const MAX_ATTEMPTS = 5

export function getClientKey(request: Request, identifier?: string): string {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() 
    || request.headers.get('x-real-ip') 
    || 'unknown'
  return identifier ? `${ip}:${identifier}` : ip
}

export function checkRateLimit(key: string): { allowed: boolean; remaining: number; resetAt: number } {
  const now = Date.now()
  const record = attempts.get(key)
  
  if (!record || now > record.resetAt) {
    attempts.set(key, { count: 1, resetAt: now + WINDOW_MS })
    return { allowed: true, remaining: MAX_ATTEMPTS - 1, resetAt: now + WINDOW_MS }
  }
  
  if (record.count >= MAX_ATTEMPTS) {
    return { allowed: false, remaining: 0, resetAt: record.resetAt }
  }
  
  record.count++
  attempts.set(key, record)
  return { allowed: true, remaining: MAX_ATTEMPTS - record.count, resetAt: record.resetAt }
}

export function resetRateLimit(key: string): void {
  attempts.delete(key)
}

export function getRateLimitInfo(key: string): { remaining: number; resetAt: number } | null {
  const record = attempts.get(key)
  if (!record) return null
  return { remaining: Math.max(0, MAX_ATTEMPTS - record.count), resetAt: record.resetAt }
}

setInterval(() => {
  const now = Date.now()
  for (const [key, record] of attempts.entries()) {
    if (now > record.resetAt) attempts.delete(key)
  }
}, WINDOW_MS)
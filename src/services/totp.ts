import { TOTP, NobleCryptoPlugin, ScureBase32Plugin } from 'otplib'
import QRCode from 'qrcode'
import { SignJWT, jwtVerify, type JWTPayload } from 'jose'

const TOTP_ISSUER = 'GateWay:Colossus'
const JWT_SECRET = new TextEncoder().encode(process.env.TOTP_JWT_SECRET || 'dev-secret-change-in-production')
const SESSION_COOKIE_NAME = 'totp_session'
const SESSION_TTL = '15m'
const REFRESH_TTL = '7d'

const plugins = {
  crypto: new NobleCryptoPlugin(),
  base32: new ScureBase32Plugin(),
}

const totp = new TOTP({
  step: 30,
  window: 1,
  digits: 6,
  ...plugins,
} as any)

export interface TOTPSetup {
  secret: string
  otpauthUrl: string
  qrCodeDataUrl: string
}

export interface SessionPayload extends JWTPayload {
  sub: string
  type: 'user' | 'shared'
  email?: string
}

export async function generateTOTPSecret(email: string): Promise<TOTPSetup> {
  const secret = totp.generateSecret()
  const otpauthUrl = totp.toURI({ label: email, issuer: TOTP_ISSUER, secret })
  const qrCodeDataUrl = await QRCode.toDataURL(otpauthUrl)
  return { secret, otpauthUrl, qrCodeDataUrl }
}

export async function verifyTOTP(token: string, secret: string): Promise<boolean> {
  const t = new TOTP({ ...plugins, secret } as any)
  const result = await t.verify(token)
  return result.valid
}

export function getSharedTOTPSecret(): string | null {
  return process.env.SHARED_TOTP_SECRET || null
}

export async function verifySharedTOTP(token: string): Promise<boolean> {
  const secret = getSharedTOTPSecret()
  if (!secret) return false
  return verifyTOTP(token, secret)
}

export async function createSession(userId: string, type: 'user' | 'shared', email?: string): Promise<string> {
  return new SignJWT({ sub: userId, type, email })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(SESSION_TTL)
    .sign(JWT_SECRET)
}

export async function createRefreshToken(userId: string, type: 'user' | 'shared'): Promise<string> {
  return new SignJWT({ sub: userId, type, refresh: true })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(REFRESH_TTL)
    .sign(JWT_SECRET)
}

export async function verifySession(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET)
    return payload as SessionPayload
  } catch {
    return null
  }
}

export async function getSessionFromRequest(request: Request): Promise<string | null> {
  const cookieHeader = request.headers.get('cookie') || ''
  const match = cookieHeader.match(new RegExp(`${SESSION_COOKIE_NAME}=([^;]+)`))
  if (!match) return null
  return decodeURIComponent(match[1])
}

export function setSessionCookie(response: Response, token: string): void {
  response.headers.append('Set-Cookie', [
    `${SESSION_COOKIE_NAME}=${encodeURIComponent(token)}`,
    'HttpOnly',
    'Secure',
    'SameSite=Strict',
    'Path=/',
    `Max-Age=${15 * 60}`,
  ].join('; '))
}

export function clearSessionCookie(response: Response): void {
  response.headers.append('Set-Cookie', [
    `${SESSION_COOKIE_NAME}=`,
    'HttpOnly',
    'Secure',
    'SameSite=Strict',
    'Path=/',
    'Max-Age=0',
  ].join('; '))
}

export async function getCurrentTOTP(secret: string): Promise<string> {
  const t = new TOTP({ ...plugins, secret } as any)
  return t.generate()
}

export function getRemainingSeconds(): number {
  return 30 - (Math.floor(Date.now() / 1000) % 30)
}
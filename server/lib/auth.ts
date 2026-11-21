import type { Context, MiddlewareHandler } from 'hono'
import { deleteCookie, getCookie, setCookie } from 'hono/cookie'
import { sign, verify } from 'hono/jwt'

export const SESSION_COOKIE = 'session'
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7 // 7 days

export type AdminSession = { sub: string; email: string }
export type AuthEnv = { Variables: { admin: AdminSession } }

function secret(): string {
  const s = process.env.JWT_SECRET
  if (!s || s.length < 32) throw new Error('JWT_SECRET must be set (32+ chars)')
  return s
}

export async function startSession(c: Context, admin: AdminSession) {
  const exp = Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS
  const token = await sign({ ...admin, exp }, secret(), 'HS256')
  setCookie(c, SESSION_COOKIE, token, {
    httpOnly: true, // JS can't read it → XSS can't steal it
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'Lax', // not sent on cross-site POST/PATCH/DELETE → basic CSRF protection
    path: '/api',
    maxAge: SESSION_TTL_SECONDS,
  })
}

export function endSession(c: Context) {
  deleteCookie(c, SESSION_COOKIE, { path: '/api' })
}

export async function readSession(c: Context): Promise<AdminSession | null> {
  const token = getCookie(c, SESSION_COOKIE)
  if (!token) return null
  try {
    const payload = await verify(token, secret(), 'HS256')
    if (typeof payload.sub !== 'string' || typeof payload.email !== 'string') return null
    return { sub: payload.sub, email: payload.email }
  } catch {
    return null // expired or tampered
  }
}

export const requireAdmin: MiddlewareHandler<AuthEnv> = async (c, next) => {
  const admin = await readSession(c)
  if (!admin) return c.json({ ok: false, error: 'unauthorized' }, 401)
  c.set('admin', admin)
  await next()
}

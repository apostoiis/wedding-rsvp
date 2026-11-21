import { Hono } from 'hono'
import { z } from 'zod'
import { prisma } from '../db'
import { endSession, readSession, startSession } from '../lib/auth'
import { verifyPassword } from '../lib/password'

const loginInput = z.object({
  email: z.email().trim().toLowerCase(),
  password: z.string().min(1).max(200),
})

export const auth = new Hono()

auth.post('/login', async (c) => {
  const parsed = loginInput.safeParse(await c.req.json().catch(() => null))
  if (!parsed.success) return c.json({ ok: false, error: 'invalid_credentials' }, 401)

  const { email, password } = parsed.data
  const admin = await prisma.admin.findUnique({ where: { email } })
  // Same error for "no such user" and "wrong password", so emails can't be probed.
  const valid = admin ? await verifyPassword(password, admin.passwordHash) : false
  if (!admin || !valid) return c.json({ ok: false, error: 'invalid_credentials' }, 401)

  await startSession(c, { sub: admin.id, email: admin.email })
  return c.json({ ok: true, email: admin.email })
})

auth.post('/logout', (c) => {
  endSession(c)
  return c.json({ ok: true })
})

auth.get('/me', async (c) => {
  const admin = await readSession(c)
  if (!admin) return c.json({ ok: false, error: 'unauthorized' }, 401)
  return c.json({ ok: true, email: admin.email })
})

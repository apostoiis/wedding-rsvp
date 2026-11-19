import { Hono } from 'hono'
import { prisma } from '../db'
import { rsvpInput } from '../schemas'

export const rsvp = new Hono()

rsvp.post('/', async (c) => {
  const deadline = process.env.RSVP_DEADLINE // ISO date, e.g. 2027-07-15T23:59:59+03:00
  if (deadline && Date.now() > Date.parse(deadline)) {
    return c.json({ ok: false, error: 'rsvp_closed' }, 403)
  }

  const body = await c.req.json().catch(() => null)

  // Honeypot filled → a bot. Pretend it worked so it learns nothing.
  if (body?.website) return c.json({ ok: true, attending: !!body.attending, updated: false }, 201)

  const parsed = rsvpInput.safeParse(body)
  if (!parsed.success) {
    return c.json({ ok: false, error: 'invalid_input', issues: parsed.error.issues }, 400)
  }

  const data = parsed.data
  // Same email → update the existing answer (guest changed their mind).
  const saved = await prisma.rsvp.upsert({
    where: { email: data.email },
    create: data,
    update: data,
    select: { id: true, attending: true, createdAt: true, updatedAt: true },
  })

  const updated = saved.updatedAt.getTime() !== saved.createdAt.getTime()
  return c.json({ ok: true, attending: saved.attending, updated }, updated ? 200 : 201)
})

import { Hono } from 'hono'
import { logger } from 'hono/logger'
import { prisma } from './db'
import { rsvp } from './routes/rsvp'

export const app = new Hono().basePath('/api')

app.use(logger())

app.get('/health', async (c) => {
  try {
    await prisma.$queryRaw`SELECT 1`
    return c.json({ ok: true, db: 'up' })
  } catch {
    return c.json({ ok: false, db: 'down' }, 503)
  }
})

app.route('/rsvp', rsvp)

app.notFound((c) => c.json({ ok: false, error: 'not_found' }, 404))
app.onError((err, c) => {
  console.error(err)
  return c.json({ ok: false, error: 'server_error' }, 500)
})

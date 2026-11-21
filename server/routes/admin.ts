import { Hono } from 'hono'
import { z } from 'zod'
import { prisma } from '../db'
import type { Prisma } from '../generated/prisma/client'
import { requireAdmin, type AuthEnv } from '../lib/auth'

export const admin = new Hono<AuthEnv>()
admin.use(requireAdmin)

const listQuery = z.object({
  q: z.string().trim().max(100).optional(),
  attending: z.enum(['all', 'yes', 'no']).default('all'),
})

function buildWhere({ q, attending }: z.infer<typeof listQuery>): Prisma.RsvpWhereInput {
  return {
    ...(attending !== 'all' && { attending: attending === 'yes' }),
    ...(q && {
      OR: [
        { firstName: { contains: q, mode: 'insensitive' } },
        { lastName: { contains: q, mode: 'insensitive' } },
        { email: { contains: q, mode: 'insensitive' } },
      ],
    }),
  }
}

// GET /api/admin/rsvps?q=maria&attending=yes
admin.get('/rsvps', async (c) => {
  const query = listQuery.safeParse(c.req.query())
  if (!query.success) return c.json({ ok: false, error: 'invalid_query' }, 400)

  const [rsvps, totals] = await Promise.all([
    prisma.rsvp.findMany({ where: buildWhere(query.data), orderBy: { updatedAt: 'desc' } }),
    // Totals always cover everyone, regardless of the current filter.
    prisma.rsvp.groupBy({ by: ['attending'], _count: { _all: true }, _sum: { adults: true, kids: true } }),
  ])

  const yes = totals.find((t) => t.attending)
  const no = totals.find((t) => !t.attending)
  const stats = {
    responses: (yes?._count._all ?? 0) + (no?._count._all ?? 0),
    attending: yes?._count._all ?? 0,
    declined: no?._count._all ?? 0,
    adults: yes?._sum.adults ?? 0,
    kids: yes?._sum.kids ?? 0,
  }

  return c.json({ ok: true, rsvps, stats })
})

const updateInput = z
  .object({
    firstName: z.string().trim().min(1).max(80),
    lastName: z.string().trim().min(1).max(80),
    email: z.email().trim().toLowerCase().max(200),
    attending: z.boolean(),
    adults: z.number().int().min(0).max(10),
    kids: z.number().int().min(0).max(10),
    notes: z.string().trim().max(1000).nullable(),
  })
  .partial()

admin.patch('/rsvps/:id', async (c) => {
  const parsed = updateInput.safeParse(await c.req.json().catch(() => null))
  if (!parsed.success) return c.json({ ok: false, error: 'invalid_input', issues: parsed.error.issues }, 400)

  const data = { ...parsed.data, ...(parsed.data.attending === false && { adults: 0, kids: 0 }) }
  try {
    const rsvp = await prisma.rsvp.update({ where: { id: c.req.param('id') }, data })
    return c.json({ ok: true, rsvp })
  } catch (err) {
    const code = (err as { code?: string }).code
    if (code === 'P2025') return c.json({ ok: false, error: 'not_found' }, 404)
    if (code === 'P2002') return c.json({ ok: false, error: 'email_taken' }, 409)
    throw err
  }
})

admin.delete('/rsvps/:id', async (c) => {
  const { count } = await prisma.rsvp.deleteMany({ where: { id: c.req.param('id') } })
  if (count === 0) return c.json({ ok: false, error: 'not_found' }, 404)
  return c.json({ ok: true })
})

// GET /api/admin/rsvps.csv: respects the same q/attending filters as the list
admin.get('/rsvps.csv', async (c) => {
  const query = listQuery.safeParse(c.req.query())
  if (!query.success) return c.json({ ok: false, error: 'invalid_query' }, 400)

  const rsvps = await prisma.rsvp.findMany({ where: buildWhere(query.data), orderBy: { lastName: 'asc' } })
  const header = ['First name', 'Last name', 'Email', 'Attending', 'Adults', 'Kids', 'Notes', 'Updated']
  const rows = rsvps.map((r) => [
    r.firstName, r.lastName, r.email, r.attending ? 'yes' : 'no',
    r.adults, r.kids, r.notes ?? '', r.updatedAt.toISOString(),
  ])
  // BOM so Excel opens Greek characters correctly
  const csv = '﻿' + [header, ...rows].map((row) => row.map(csvCell).join(',')).join('\r\n')

  c.header('Content-Type', 'text/csv; charset=utf-8')
  c.header('Content-Disposition', 'attachment; filename="rsvps.csv"')
  return c.body(csv)
})

function csvCell(value: unknown): string {
  let s = String(value)
  if (/^[=+\-@]/.test(s)) s = `'${s}` // block formula injection in Excel/Sheets
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

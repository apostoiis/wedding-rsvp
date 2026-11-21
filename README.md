# Wedding RSVP

A mobile-first RSVP form plus a small admin dashboard for the couple.

**Stack:** Vite + React + TS · Hono (API) · Prisma 7 + Prisma Postgres · Zod · Vercel

## Structure

```
api/index.ts          Vercel entry: all /api/* requests rewrite here
server/app.ts         Hono app: routes, error handling, /api/health
server/routes/rsvp.ts POST /api/rsvp (upsert by email, deadline, honeypot)
server/routes/auth.ts POST /api/auth/login|logout, GET /api/auth/me
server/routes/admin.ts /api/admin/rsvps: list/search/filter, PATCH, DELETE, .csv
server/lib/auth.ts    JWT session cookie (httpOnly) + requireAdmin middleware
server/schemas.ts     Zod validation
server/db.ts          Prisma client (pg driver adapter)
server/lib/password.ts scrypt hashing for admin passwords
server/dev.ts         Local API server (port 3000)
prisma/schema.prisma  Rsvp + Admin models
prisma/seed.ts        Creates the 2 admin accounts from env
src/                  React app: RSVP form at /, dashboard at /admin
```

## Setup

1. Create a database at [console.prisma.io](https://console.prisma.io) and copy its connection string.
2. Set up and run:

```bash
cp .env.example .env        # paste DATABASE_URL, set admin emails/passwords
npm install                 # also runs `prisma generate`
npm run db:migrate -- --name init   # creates prisma/migrations + tables
npm run db:seed             # creates the 2 admins
npm run dev                 # API → :3000, web → :5173 (proxies /api)
```

Quick test:

```bash
curl localhost:3000/api/health
curl -X POST localhost:3000/api/rsvp -H 'content-type: application/json' \
  -d '{"firstName":"Maria","lastName":"P","email":"maria@example.com","attending":true,"adults":2,"kids":1}'
```

Sending the same email again updates that answer (201 = created, 200 = updated).

## Scripts

| Script | What it does |
| --- | --- |
| `dev` | API + Vite together |
| `build` | `prisma generate` + `vite build` |
| `typecheck` | `tsc` |
| `db:migrate` | new migration from schema changes (dev) |
| `db:deploy` | apply migrations (production) |
| `db:seed` | create/update admins |
| `db:studio` | browse data in Prisma Studio |

## Deploy (Vercel)

1. Import the repo in Vercel. `vercel.json` already sets the build and rewrites.
2. Add the env vars `DATABASE_URL`, `JWT_SECRET` (`openssl rand -base64 48`) and `RSVP_DEADLINE`.
3. Run migrations against production once: `DATABASE_URL=<prod> npm run db:deploy && npm run db:seed`.
4. Point an uptime monitor at `https://<domain>/api/health`.

## Roadmap

- [x] Day 1: schema, seed
- [x] Day 2: `POST /api/rsvp`
- [x] Day 3: auth (login/logout, httpOnly JWT cookie, middleware)
- [x] Day 4: admin endpoints (list/search/filter, edit, delete, CSV)
- [ ] Day 5: RSVP form polish
- [x] Day 6: admin dashboard UI
- [ ] Day 7: deploy + uptime monitor
- Later: tags, scheduled messages (Resend)

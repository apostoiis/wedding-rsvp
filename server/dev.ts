// Local dev server for the API. Vite proxies /api → here.
import 'dotenv/config'
import { serve } from '@hono/node-server'
import { app } from './app'

const port = Number(process.env.API_PORT ?? 3000)
serve({ fetch: app.fetch, port }, () => console.log(`API → http://localhost:${port}/api`))

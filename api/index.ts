// Vercel entry: every /api/* request is rewritten here (see vercel.json).
import { handle } from 'hono/vercel'
import { app } from '../server/app'

const handler = handle(app)

export const GET = handler
export const POST = handler
export const PATCH = handler
export const DELETE = handler

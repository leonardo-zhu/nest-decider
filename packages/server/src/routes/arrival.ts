import { Hono } from 'hono'
import { ok } from '../core/http.js'
import { getArrivalRange } from '../domains/services.js'

export const arrivalRoutes = new Hono()

arrivalRoutes.get('/', async (c) => {
  const minutesRaw = c.req.query('minutes')
  const targetId = c.req.query('targetId')
  const minutes = Number(minutesRaw)

  if (!Number.isFinite(minutes) || minutes <= 0) {
    return c.json({ ok: false, error: { code: 'BAD_REQUEST', message: 'minutes must be positive number' } }, 400)
  }

  const data = await getArrivalRange(Math.floor(minutes), targetId)
  return ok(c, data)
})

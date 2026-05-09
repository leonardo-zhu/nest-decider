import { Hono } from 'hono'
import { store } from '../store.js'

export const propertyRoutes = new Hono()

propertyRoutes.get('/', async (c) => {
  const rows = await store.readProperties()
  return c.json(rows)
})

propertyRoutes.put('/', async (c) => {
  const payload = await c.req.json()
  if (!Array.isArray(payload)) {
    return c.json({ error: 'payload must be array' }, 400)
  }

  await store.writeProperties(payload)
  return c.json({ ok: true })
})

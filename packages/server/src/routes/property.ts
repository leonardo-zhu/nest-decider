import { Hono } from 'hono'
import { store } from '../domains/store.js'
import { sanitizePropertyCreate, sanitizePropertyPatch, validateIntakeStage } from '../domains/validation.js'

export const propertyRoutes = new Hono()

propertyRoutes.get('/', async (c) => {
  const status = c.req.query('status')
  const rows = await store.readProperties()

  if (!status) {
    return c.json(rows)
  }

  const filtered = rows.filter((item) => item.status === status)
  return c.json(filtered)
})

propertyRoutes.get('/:id', async (c) => {
  const id = c.req.param('id')
  const rows = await store.readProperties()
  const found = rows.find((item) => item.id === id)

  if (!found) {
    return c.json({ error: 'property not found' }, 404)
  }

  return c.json(found)
})

propertyRoutes.post('/', async (c) => {
  const payload = await c.req.json()
  const nowIso = new Date().toISOString()
  const parsed = sanitizePropertyCreate(payload, nowIso)

  if (!parsed.ok) {
    return c.json({ error: parsed.error }, 400)
  }

  const stage = c.req.query('stage') as 'stage1' | 'stage2' | undefined
  validateIntakeStage(parsed.value, stage)

  const rows = await store.readProperties()
  if (rows.some((item) => item.id === parsed.value.id)) {
    return c.json({ error: 'property id already exists' }, 409)
  }

  rows.push(parsed.value)
  await store.writeProperties(rows)

  return c.json(parsed.value, 201)
})

propertyRoutes.put('/:id', async (c) => {
  const id = c.req.param('id')
  const payload = await c.req.json()
  const rows = await store.readProperties()
  const index = rows.findIndex((item) => item.id === id)

  if (index < 0) {
    return c.json({ error: 'property not found' }, 404)
  }

  const parsed = sanitizePropertyPatch(rows[index], payload, new Date().toISOString())
  if (!parsed.ok) {
    return c.json({ error: parsed.error }, 400)
  }

  const stage = c.req.query('stage') as 'stage1' | 'stage2' | undefined
  validateIntakeStage(parsed.value, stage)

  rows[index] = parsed.value
  await store.writeProperties(rows)

  return c.json(parsed.value)
})

propertyRoutes.delete('/:id', async (c) => {
  const id = c.req.param('id')
  const rows = await store.readProperties()
  const nextRows = rows.filter((item) => item.id !== id)

  if (nextRows.length === rows.length) {
    return c.json({ error: 'property not found' }, 404)
  }

  await store.writeProperties(nextRows)
  return c.json({ ok: true })
})

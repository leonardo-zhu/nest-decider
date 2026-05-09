import { Hono } from 'hono'
import { store } from '../domains/store.js'
import { sanitizeSettings, sanitizeTargetCreate } from '../domains/validation.js'

export const targetRoutes = new Hono()

targetRoutes.get('/', async (c) => {
  const rows = await store.readTargets()
  const settings = await store.readSettings()
  return c.json({ targets: rows, settings })
})

targetRoutes.post('/', async (c) => {
  const payload = await c.req.json()
  const parsed = sanitizeTargetCreate(payload, new Date().toISOString())

  if (!parsed.ok) {
    return c.json({ error: parsed.error }, 400)
  }

  const rows = await store.readTargets()
  if (rows.some((item) => item.id === parsed.value.id)) {
    return c.json({ error: 'target id already exists' }, 409)
  }

  rows.push(parsed.value)
  await store.writeTargets(rows)

  return c.json(parsed.value, 201)
})

targetRoutes.put('/:id', async (c) => {
  const id = c.req.param('id')
  const payload = await c.req.json()
  const rows = await store.readTargets()
  const index = rows.findIndex((item) => item.id === id)

  if (index < 0) {
    return c.json({ error: 'target not found' }, 404)
  }

  const base = rows[index]
  const mergedPayload = {
    ...base,
    ...(payload as Record<string, unknown>),
    id,
    createdAt: base.createdAt,
  }
  const parsed = sanitizeTargetCreate(mergedPayload, new Date().toISOString())

  if (!parsed.ok) {
    return c.json({ error: parsed.error }, 400)
  }

  rows[index] = {
    ...parsed.value,
    createdAt: base.createdAt,
  }

  await store.writeTargets(rows)
  return c.json(rows[index])
})

targetRoutes.delete('/:id', async (c) => {
  const id = c.req.param('id')
  const rows = await store.readTargets()
  const nextRows = rows.filter((item) => item.id !== id)

  if (nextRows.length === rows.length) {
    return c.json({ error: 'target not found' }, 404)
  }

  await store.writeTargets(nextRows)

  const settings = await store.readSettings()
  if (settings.activeTargetId === id) {
    await store.writeSettings({ activeTargetId: null })
  }

  return c.json({ ok: true })
})

targetRoutes.put('/active/:id', async (c) => {
  const id = c.req.param('id')
  const rows = await store.readTargets()

  if (!rows.some((item) => item.id === id)) {
    return c.json({ error: 'target not found' }, 404)
  }

  await store.writeSettings({ activeTargetId: id })
  return c.json({ ok: true, activeTargetId: id })
})

targetRoutes.put('/active', async (c) => {
  const payload = await c.req.json()
  const parsed = sanitizeSettings(payload)

  if (!parsed.ok) {
    return c.json({ error: parsed.error }, 400)
  }

  if (parsed.value.activeTargetId !== null) {
    const rows = await store.readTargets()
    if (!rows.some((item) => item.id === parsed.value.activeTargetId)) {
      return c.json({ error: 'target not found' }, 404)
    }
  }

  await store.writeSettings(parsed.value)
  return c.json({ ok: true, ...parsed.value })
})

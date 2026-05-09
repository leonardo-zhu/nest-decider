import { Hono } from 'hono'
import { store } from '../store.js'

export const targetRoutes = new Hono()

targetRoutes.get('/', async (c) => {
  const rows = await store.readTargets()
  const settings = await store.readSettings()
  return c.json({ targets: rows, settings })
})

targetRoutes.put('/', async (c) => {
  const payload = await c.req.json()
  const { targets, activeTargetId } = payload as {
    targets: unknown
    activeTargetId: unknown
  }

  if (!Array.isArray(targets)) {
    return c.json({ error: 'targets must be array' }, 400)
  }

  await store.writeTargets(targets as never[])
  await store.writeSettings({
    activeTargetId: typeof activeTargetId === 'string' ? activeTargetId : null,
  })

  return c.json({ ok: true })
})

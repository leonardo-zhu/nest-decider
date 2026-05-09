import { Hono } from 'hono'
import { ok } from '../http.js'
import { createMediaUploadPresign, deleteMediaObject } from '../services.js'

export const mediaRoutes = new Hono()

mediaRoutes.post('/presign-upload', async (c) => {
  const body = (await c.req.json()) as Record<string, unknown>
  const propertyId = typeof body.propertyId === 'string' ? body.propertyId.trim() : ''
  const fileName = typeof body.fileName === 'string' ? body.fileName.trim() : ''
  const contentType = typeof body.contentType === 'string' ? body.contentType.trim() : 'application/octet-stream'

  if (!propertyId || !fileName) {
    return c.json({ ok: false, error: { code: 'BAD_REQUEST', message: 'propertyId and fileName are required' } }, 400)
  }

  const data = await createMediaUploadPresign({ propertyId, fileName, contentType })
  return ok(c, data, 201)
})

mediaRoutes.delete('/', async (c) => {
  const body = (await c.req.json()) as Record<string, unknown>
  const key = typeof body.key === 'string' ? body.key.trim() : ''

  if (!key) {
    return c.json({ ok: false, error: { code: 'BAD_REQUEST', message: 'key is required' } }, 400)
  }

  const data = await deleteMediaObject(key)
  return ok(c, data)
})

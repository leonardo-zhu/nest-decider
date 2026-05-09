import { Hono } from 'hono'
import { ok } from '../core/http.js'
import { getPoiByProperty } from '../domains/services.js'

export const poiRoutes = new Hono()

poiRoutes.get('/:propertyId', async (c) => {
  const propertyId = c.req.param('propertyId')
  const category = c.req.query('category') as 'subway' | 'market' | 'hospital' | undefined

  if (!category || !['subway', 'market', 'hospital'].includes(category)) {
    return c.json({ ok: false, error: { code: 'BAD_REQUEST', message: 'category must be subway|market|hospital' } }, 400)
  }

  const data = await getPoiByProperty(propertyId, category)
  return ok(c, data)
})

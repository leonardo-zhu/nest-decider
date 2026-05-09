import { Hono } from 'hono'
import { ok } from '../http.js'
import { geocodeAddress } from '../amap-client.js'
import { queryTempCommute, refreshFixedCommuteForAll } from '../services.js'

export const commuteRoutes = new Hono()

commuteRoutes.post('/refresh-fixed', async (c) => {
  const data = await refreshFixedCommuteForAll()
  return ok(c, data)
})

commuteRoutes.post('/query-temp', async (c) => {
  const body = (await c.req.json()) as Record<string, unknown>
  const address = typeof body.address === 'string' ? body.address.trim() : ''
  const name = typeof body.name === 'string' ? body.name.trim() : '临时地点'

  if (!address) {
    return c.json({ ok: false, error: { code: 'BAD_REQUEST', message: 'address is required' } }, 400)
  }

  const geo = await geocodeAddress(address)
  const geocodes = (geo.geocodes as Array<Record<string, string>> | undefined) ?? []
  if (geocodes.length === 0 || !geocodes[0].location) {
    return c.json({ ok: false, error: { code: 'GEOCODE_EMPTY', message: 'cannot resolve address' } }, 400)
  }

  const [lng, lat] = geocodes[0].location.split(',').map(Number)
  const data = await queryTempCommute({
    id: `temp-${Date.now()}`,
    name,
    address,
    lat,
    lng,
  })

  return ok(c, data)
})

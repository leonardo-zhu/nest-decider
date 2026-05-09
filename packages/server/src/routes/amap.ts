import { Hono } from 'hono'
import type { ContentfulStatusCode } from 'hono/utils/http-status'

export const amapRoutes = new Hono()

amapRoutes.get('/*', async (c) => {
  const webKey = process.env.AMAP_WEB_KEY
  if (!webKey) {
    return c.json({ error: 'AMAP_WEB_KEY is not set' }, 500)
  }

  const path = c.req.path.replace(/^\/api\/amap/, '')
  const url = new URL(`https://restapi.amap.com${path}`)

  const incoming = new URL(c.req.url)
  incoming.searchParams.forEach((value, key) => {
    url.searchParams.set(key, value)
  })

  url.searchParams.set('key', webKey)

  const res = await fetch(url.toString())
  const body = await res.text()

  return c.body(body, res.status as ContentfulStatusCode, {
    'content-type': 'application/json; charset=utf-8',
  })
})

import { serve } from '@hono/node-server'
import { cors } from 'hono/cors'
import { Hono } from 'hono'
import { amapRoutes } from './routes/amap.js'
import { propertyRoutes } from './routes/property.js'
import { targetRoutes } from './routes/target.js'

const app = new Hono()

const allowedOrigin = process.env.CORS_ORIGIN ?? '*'
app.use('/api/*', cors({ origin: allowedOrigin }))

app.get('/api/health', (c) => {
  return c.json({ ok: true })
})

app.route('/api/properties', propertyRoutes)
app.route('/api/targets', targetRoutes)
app.route('/api/amap', amapRoutes)

const port = Number(process.env.PORT ?? 3001)

serve({ fetch: app.fetch, port })

console.log(`server running on :${port}`)

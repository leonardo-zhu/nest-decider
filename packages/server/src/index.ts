import { serve } from '@hono/node-server'
import { cors } from 'hono/cors'
import { Hono } from 'hono'
import { env } from './env.js'
import { errorMiddleware, ok } from './http.js'
import { amapRoutes } from './routes/amap.js'
import { propertyRoutes } from './routes/property.js'
import { targetRoutes } from './routes/target.js'
import { commuteRoutes } from './routes/commute.js'
import { mediaRoutes } from './routes/media.js'
import { poiRoutes } from './routes/poi.js'
import { arrivalRoutes } from './routes/arrival.js'
import { aiRoutes } from './routes/ai.js'

const app = new Hono()
app.use('*', errorMiddleware)
app.use('/api/*', cors({ origin: env.corsOrigin }))

app.get('/api/health', (c) => ok(c, { service: 'server', status: 'up' }))

app.route('/api/properties', propertyRoutes)
app.route('/api/targets', targetRoutes)
app.route('/api/commute', commuteRoutes)
app.route('/api/poi', poiRoutes)
app.route('/api/arrival-range', arrivalRoutes)
app.route('/api/media', mediaRoutes)
app.route('/api/ai', aiRoutes)
app.route('/api/amap', amapRoutes)

serve({ fetch: app.fetch, port: env.port })
console.log(`server running on :${env.port}`)

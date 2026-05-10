import { serve } from '@hono/node-server'
import { cors } from 'hono/cors'
import { Hono } from 'hono'
import { env } from './config/env.js'
import { errorMiddleware, ok } from './core/http.js'
import { propertyRoutes } from './routes/property.js'
import { targetRoutes } from './routes/target.js'

const app = new Hono()
app.use('*', errorMiddleware)
app.use('/api/*', cors({ origin: env.corsOrigin }))

app.get('/api/health', (c) => ok(c, { service: 'server', status: 'up' }))

app.route('/api/properties', propertyRoutes)
app.route('/api/targets', targetRoutes)

serve({ fetch: app.fetch, port: env.port })
console.log(`server running on :${env.port}`)

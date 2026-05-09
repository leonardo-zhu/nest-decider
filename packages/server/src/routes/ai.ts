import { Hono } from 'hono'
import { ok } from '../http.js'
import { evaluateWithLLM } from '../services.js'

export const aiRoutes = new Hono()

aiRoutes.post('/evaluate', async (c) => {
  const body = (await c.req.json()) as Record<string, unknown>
  const mode = body.mode === 'compare' ? 'compare' : 'single'
  const propertyIds = Array.isArray(body.propertyIds)
    ? body.propertyIds.filter((item): item is string => typeof item === 'string')
    : []
  const customPrompt = typeof body.customPrompt === 'string' ? body.customPrompt : undefined

  if (propertyIds.length === 0) {
    return c.json({ ok: false, error: { code: 'BAD_REQUEST', message: 'propertyIds is required' } }, 400)
  }

  const data = await evaluateWithLLM({ mode, propertyIds, customPrompt })
  return ok(c, data)
})

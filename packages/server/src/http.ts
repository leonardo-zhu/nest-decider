import type { Context, Next } from 'hono'
import { AppError } from './errors.js'

export function ok<T>(c: Context, data: T, status: 200 | 201 = 200) {
  return c.json({ ok: true, data }, status)
}

export async function errorMiddleware(c: Context, next: Next) {
  try {
    await next()
  } catch (error) {
    if (error instanceof AppError) {
      return c.json({ ok: false, error: { code: error.code, message: error.message } }, error.status as 400)
    }

    console.error(error)
    return c.json(
      { ok: false, error: { code: 'INTERNAL_ERROR', message: 'internal server error' } },
      500,
    )
  }
}

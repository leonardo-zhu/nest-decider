import crypto from 'node:crypto'
import { env } from '../config/env.js'
import { fail } from '../core/errors.js'

function withSig(url: URL): void {
  if (!env.amapWebSig) return
  const entries = [...url.searchParams.entries()].sort(([a], [b]) => a.localeCompare(b))
  const query = entries.map(([k, v]) => `${k}=${v}`).join('&')
  const sig = crypto.createHash('md5').update(`${query}${env.amapWebSig}`).digest('hex')
  url.searchParams.set('sig', sig)
}

async function request(path: string, params: Record<string, string | number>) {
  if (!env.amapWebKey) {
    fail(500, 'AMAP_KEY_MISSING', 'AMAP_WEB_KEY is required')
  }

  const url = new URL(`https://restapi.amap.com${path}`)
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, String(value))
  }
  url.searchParams.set('key', env.amapWebKey)
  withSig(url)

  const res = await fetch(url)
  const json = (await res.json()) as Record<string, unknown>
  if (!res.ok || json.status === '0') {
    fail(502, 'AMAP_API_ERROR', String(json.info ?? 'amap request failed'))
  }

  return json
}

export function geocodeAddress(address: string) {
  return request('/v3/geocode/geo', { address })
}

export function transitRoute(origin: string, destination: string, city: string) {
  return request('/v3/direction/transit/integrated', {
    origin,
    destination,
    city,
    strategy: 0,
    nightflag: 0,
  })
}

export function nearbyPoi(location: string, keywords: string, radius = 2000) {
  return request('/v3/place/around', {
    location,
    keywords,
    radius,
    sortrule: 'distance',
    extensions: 'base',
  })
}

export function arrivalRange(location: string, time: number) {
  return request('/v4/direction/bus/arrivalrange', {
    location,
    time,
  })
}

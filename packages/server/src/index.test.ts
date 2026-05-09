import { describe, expect, it } from 'vitest'
import { sanitizePropertyCreate } from './validation.js'

describe('validation', () => {
  it('calculates pricePerSqm', () => {
    const now = new Date().toISOString()
    const result = sanitizePropertyCreate(
      {
        id: 'p1',
        name: 'test',
        address: 'shenzhen',
        lat: 22.5,
        lng: 113.9,
        price: 5000,
        area: 25,
        mediaUrls: [],
      },
      now,
    )

    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value.pricePerSqm).toBe(200)
      expect(result.value.status).toBe('pending')
    }
  })
})

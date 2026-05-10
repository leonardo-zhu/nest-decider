import { describe, expect, it } from 'vitest'
import { sanitizePropertyCreate } from './domains/validation.js'

describe('validation', () => {
  it('accepts create when only agentWechatName is provided', () => {
    const now = new Date().toISOString()
    const result = sanitizePropertyCreate(
      {
        id: 'p1',
        name: 'test',
        agentWechatName: '张三',
        address: 'shenzhen',
        lat: 22.5,
        lng: 113.9,
        mediaUrls: [],
      },
      now,
    )

    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value.agentWechatName).toBe('张三')
      expect(result.value.status).toBe('pending')
    }
  })

  it('rejects create when both agentWechatId and agentWechatName are missing', () => {
    const now = new Date().toISOString()
    const result = sanitizePropertyCreate(
      {
        id: 'p2',
        name: 'test2',
        address: 'shenzhen',
        lat: 22.5,
        lng: 113.9,
        mediaUrls: [],
      },
      now,
    )

    expect(result.ok).toBe(false)
  })
})

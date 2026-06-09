import { describe, it, expect, vi, afterEach } from 'vitest'
import { rateLimit, clientIp } from './rateLimit'

describe('rateLimit', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('allows requests up to the limit, then blocks', () => {
    const key = `test-allow-${Math.random()}`
    expect(rateLimit(key, 3, 60_000).ok).toBe(true)
    expect(rateLimit(key, 3, 60_000).ok).toBe(true)
    expect(rateLimit(key, 3, 60_000).ok).toBe(true)
    const blocked = rateLimit(key, 3, 60_000)
    expect(blocked.ok).toBe(false)
    expect(blocked.retryAfter).toBeGreaterThan(0)
  })

  it('tracks separate keys independently', () => {
    const a = `test-a-${Math.random()}`
    const b = `test-b-${Math.random()}`
    expect(rateLimit(a, 1, 60_000).ok).toBe(true)
    expect(rateLimit(a, 1, 60_000).ok).toBe(false)
    // b is untouched
    expect(rateLimit(b, 1, 60_000).ok).toBe(true)
  })

  it('resets after the window elapses', () => {
    vi.useFakeTimers()
    const key = `test-reset-${Math.random()}`
    expect(rateLimit(key, 1, 1_000).ok).toBe(true)
    expect(rateLimit(key, 1, 1_000).ok).toBe(false)
    vi.advanceTimersByTime(1_001)
    expect(rateLimit(key, 1, 1_000).ok).toBe(true)
  })
})

describe('clientIp', () => {
  it('uses the first IP in x-forwarded-for', () => {
    const req = new Request('https://x.test', {
      headers: { 'x-forwarded-for': '203.0.113.1, 70.41.3.18' },
    })
    expect(clientIp(req)).toBe('203.0.113.1')
  })

  it('falls back to x-real-ip', () => {
    const req = new Request('https://x.test', { headers: { 'x-real-ip': '198.51.100.7' } })
    expect(clientIp(req)).toBe('198.51.100.7')
  })

  it('returns "unknown" when no IP headers are present', () => {
    const req = new Request('https://x.test')
    expect(clientIp(req)).toBe('unknown')
  })
})

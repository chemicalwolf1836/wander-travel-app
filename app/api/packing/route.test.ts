import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest'

// Mock the shared AI helpers: fake Anthropic client + cache, but keep the real
// parseClaudeJson/extractText/ClaudeJsonError so the parse paths are exercised.
const mockCreate = vi.hoisted(() => vi.fn())
vi.mock('@/lib/ai', async (importActual) => {
  const actual = await importActual<typeof import('@/lib/ai')>()
  return {
    ...actual,
    getAnthropic: () => ({ messages: { create: mockCreate } }),
    getCached: vi.fn(),
    setCached: vi.fn(),
  }
})

vi.mock('@/lib/rateLimit', () => ({
  rateLimit: vi.fn(() => ({ ok: true, retryAfter: 0 })),
  clientIp: vi.fn(() => 'test-ip'),
}))

import { POST } from './route'
import { getCached, setCached } from '@/lib/ai'
import { rateLimit } from '@/lib/rateLimit'

const create = mockCreate

function post(body: unknown): Request {
  return new Request('http://localhost/api/packing', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'content-type': 'application/json' },
  })
}

function claudeText(text: string) {
  return { content: [{ type: 'text', text }] }
}

const validBody = { city: 'Kyoto', country: 'Japan', tripDays: 5 }

beforeEach(() => {
  vi.clearAllMocks()
  ;(rateLimit as Mock).mockReturnValue({ ok: true, retryAfter: 0 })
  ;(getCached as Mock).mockResolvedValue(null)
  ;(setCached as Mock).mockResolvedValue(undefined)
})

describe('POST /api/packing', () => {
  it('returns 400 on invalid input', async () => {
    const res = await POST(post({ city: 'Kyoto' })) // missing country
    expect(res.status).toBe(400)
    expect(create).not.toHaveBeenCalled()
  })

  it('returns 429 when rate limited (and never calls Claude)', async () => {
    ;(rateLimit as Mock).mockReturnValueOnce({ ok: false, retryAfter: 42 })
    const res = await POST(post(validBody))
    expect(res.status).toBe(429)
    expect(res.headers.get('Retry-After')).toBe('42')
    expect(create).not.toHaveBeenCalled()
  })

  it('serves a cache hit without calling Claude', async () => {
    const cached = [{ name: 'Clothing', items: ['socks'] }]
    ;(getCached as Mock).mockResolvedValueOnce(cached)
    const res = await POST(post(validBody))
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual(cached)
    expect(create).not.toHaveBeenCalled()
  })

  it('returns 503 when Claude errors', async () => {
    create.mockRejectedValueOnce(new Error('overloaded'))
    const res = await POST(post(validBody))
    expect(res.status).toBe(503)
  })

  it('returns 500 when Claude returns unparseable JSON', async () => {
    create.mockResolvedValueOnce(claudeText('not json at all'))
    const res = await POST(post(validBody))
    expect(res.status).toBe(500)
  })

  it('returns 502 when Claude returns the wrong shape (empty array)', async () => {
    create.mockResolvedValueOnce(claudeText('[]'))
    const res = await POST(post(validBody))
    expect(res.status).toBe(502)
  })

  it('parses, caches, and returns categories on success', async () => {
    const categories = [{ name: 'Clothing', items: ['socks', 'jacket'] }]
    create.mockResolvedValueOnce(claudeText(JSON.stringify(categories)))
    const res = await POST(post(validBody))
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual(categories)
    expect(setCached).toHaveBeenCalledWith('packing', 'Kyoto::5', categories)
  })
})

import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest'

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

function post(body: unknown): Request {
  return new Request('http://localhost/api/budget', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'content-type': 'application/json' },
  })
}

const claudeText = (text: string) => ({ content: [{ type: 'text', text }] })
const validBody = { city: 'Lisbon', country: 'Portugal', style: 'mid' }

beforeEach(() => {
  vi.clearAllMocks()
  ;(getCached as Mock).mockResolvedValue(null)
  ;(setCached as Mock).mockResolvedValue(undefined)
})

describe('POST /api/budget', () => {
  it('returns 502 when the object is valid JSON but has no categories', async () => {
    mockCreate.mockResolvedValueOnce(claudeText('{"currency":"EUR","dailyTotal":"€80"}'))
    const res = await POST(post(validBody))
    expect(res.status).toBe(502)
  })

  it('returns and caches a valid estimate', async () => {
    const estimate = {
      currency: 'EUR',
      dailyTotal: '€80–120',
      categories: [{ name: 'Accommodation', cost: '€40', note: 'guesthouse' }],
    }
    mockCreate.mockResolvedValueOnce(claudeText(JSON.stringify(estimate)))
    const res = await POST(post(validBody))
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual(estimate)
    expect(setCached).toHaveBeenCalledWith('budget', 'Lisbon::mid', estimate)
  })
})

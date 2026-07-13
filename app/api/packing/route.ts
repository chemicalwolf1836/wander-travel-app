import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getAnthropic, extractText, parseClaudeJson, ClaudeJsonError, getCached, setCached } from '@/lib/ai'
import { rateLimit, clientIp } from '@/lib/rateLimit'

const schema = z.object({
  city: z.string(),
  country: z.string(),
  bestSeasons: z.array(z.string()).optional(),
  climate: z.string().optional(),
  tripDays: z.number().optional(),
})

export interface PackingCategory {
  name: string
  items: string[]
}

export async function POST(req: Request) {
  const limit = rateLimit(`packing:${clientIp(req)}`, 20, 60_000)
  if (!limit.ok) {
    return NextResponse.json(
      { error: 'Too many requests. Please slow down.' },
      { status: 429, headers: { 'Retry-After': String(limit.retryAfter) } },
    )
  }

  const body: unknown = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Invalid request' }, { status: 400 })

  const { city, country, bestSeasons, climate, tripDays } = parsed.data
  const cacheKey = `${city}::${tripDays ?? 7}`

  const cached = await getCached<PackingCategory[]>('packing', cacheKey)
  if (cached) return NextResponse.json(cached)

  const contextLines = [
    `Destination: ${city}, ${country}`,
    bestSeasons?.length ? `Best seasons: ${bestSeasons.join(', ')}` : '',
    climate ? `Climate notes: ${climate}` : '',
    tripDays ? `Trip length: ${tripDays} days` : 'Trip length: ~7 days',
  ].filter(Boolean).join('\n')

  let response
  try {
    response = await getAnthropic().messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 800,
      messages: [{
        role: 'user',
        content: `You are a travel packing expert. Generate a packing list for this trip:

${contextLines}

Return ONLY a JSON array of categories, no markdown, no explanation:
[{"name":"Category","items":["item1","item2"]}]

Include 6-8 categories: Clothing, Toiletries, Documents, Electronics, Health & Safety, Money & Payments, Extras for this specific destination. Keep items concise (3-6 words max). Use correct English spelling and punctuation.`,
      }],
    })
  } catch (err) {
    console.error('[packing] Claude error:', err)
    return NextResponse.json(
      { error: 'The packing service is busy. Please try again in a moment.' },
      { status: 503 },
    )
  }

  let categories: PackingCategory[]
  try {
    categories = parseClaudeJson<PackingCategory[]>(extractText(response), { expectArray: true })
  } catch (err) {
    const status = err instanceof ClaudeJsonError && err.reason === 'shape' ? 502 : 500
    return NextResponse.json({ error: 'Failed to parse packing list' }, { status })
  }

  await setCached('packing', cacheKey, categories)
  return NextResponse.json(categories)
}

import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getAnthropic, extractText, parseClaudeJson, ClaudeJsonError, getCached, setCached } from '@/lib/ai'
import { rateLimit, clientIp } from '@/lib/rateLimit'

const schema = z.object({
  city: z.string(),
  country: z.string(),
  attractions: z.array(z.string()),
  dishes: z.array(z.string()),
  bestFor: z.array(z.string()).optional(),
  tripDays: z.number().min(1).max(14).default(5),
})

export interface ItineraryDay {
  day: number
  title: string
  morning: string
  afternoon: string
  evening: string
  tip: string
}

export async function POST(req: Request) {
  const limit = rateLimit(`itinerary:${clientIp(req)}`, 20, 60_000)
  if (!limit.ok) {
    return NextResponse.json(
      { error: 'Too many requests. Please slow down.' },
      { status: 429, headers: { 'Retry-After': String(limit.retryAfter) } },
    )
  }

  const body: unknown = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Invalid request' }, { status: 400 })

  const { city, country, attractions, dishes, bestFor, tripDays } = parsed.data
  const cacheKey = `${city}::${tripDays}`

  const cached = await getCached<ItineraryDay[]>('itinerary', cacheKey)
  if (cached) return NextResponse.json(cached)

  let response
  try {
    response = await getAnthropic().messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1200,
      messages: [{
        role: 'user',
        content: `You are a luxury travel writer creating a ${tripDays}-day itinerary for ${city}, ${country}.

Known attractions: ${attractions.slice(0, 6).join(', ')}
Must-try food: ${dishes.slice(0, 5).join(', ')}
${bestFor?.length ? `Great for: ${bestFor.slice(0, 4).join(', ')}` : ''}

Return ONLY a JSON array, no markdown, no extra text:
[{"day":1,"title":"Short evocative day title","morning":"One sentence.","afternoon":"One sentence.","evening":"One sentence.","tip":"One local insider tip."}]

Write ${tripDays} days. Be specific, sensory, and atmospheric. Use correct English spelling and punctuation.`,
      }],
    })
  } catch (err) {
    console.error('[itinerary] Claude error:', err)
    return NextResponse.json(
      { error: 'The itinerary service is busy. Please try again in a moment.' },
      { status: 503 },
    )
  }

  let days: ItineraryDay[]
  try {
    days = parseClaudeJson<ItineraryDay[]>(extractText(response), { expectArray: true })
  } catch (err) {
    const status = err instanceof ClaudeJsonError && err.reason === 'shape' ? 502 : 500
    return NextResponse.json({ error: 'Failed to parse itinerary' }, { status })
  }

  await setCached('itinerary', cacheKey, days)
  return NextResponse.json(days)
}

import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { z } from 'zod'

const client = new Anthropic()

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

const cache = new Map<string, ItineraryDay[]>()

export async function POST(req: Request) {
  const body: unknown = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Invalid request' }, { status: 400 })

  const { city, country, attractions, dishes, bestFor, tripDays } = parsed.data
  const cacheKey = `${city}::${tripDays}`
  if (cache.has(cacheKey)) return NextResponse.json(cache.get(cacheKey))

  const response = await client.messages.create({
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

  const raw = response.content[0].type === 'text' ? response.content[0].text.trim() : '[]'
  const text = raw.replace(/^```(?:json)?\s*/m, '').replace(/\s*```\s*$/m, '').trim()

  try {
    const days = JSON.parse(text) as ItineraryDay[]
    cache.set(cacheKey, days)
    return NextResponse.json(days)
  } catch {
    return NextResponse.json({ error: 'Failed to parse itinerary' }, { status: 500 })
  }
}

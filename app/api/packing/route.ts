import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { z } from 'zod'

const client = new Anthropic()

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

const cache = new Map<string, PackingCategory[]>()

export async function POST(req: Request) {
  const body: unknown = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Invalid request' }, { status: 400 })

  const { city, country, bestSeasons, climate, tripDays } = parsed.data
  const cacheKey = `${city}::${tripDays ?? 7}`
  if (cache.has(cacheKey)) return NextResponse.json(cache.get(cacheKey))

  const contextLines = [
    `Destination: ${city}, ${country}`,
    bestSeasons?.length ? `Best seasons: ${bestSeasons.join(', ')}` : '',
    climate ? `Climate notes: ${climate}` : '',
    tripDays ? `Trip length: ${tripDays} days` : 'Trip length: ~7 days',
  ].filter(Boolean).join('\n')

  let response
  try {
    response = await client.messages.create({
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

  const raw = response.content[0]?.type === 'text' ? response.content[0].text.trim() : '[]'
  const text = raw.replace(/^```(?:json)?\s*/m, '').replace(/\s*```\s*$/m, '').trim()

  try {
    const categories = JSON.parse(text) as PackingCategory[]
    cache.set(cacheKey, categories)
    return NextResponse.json(categories)
  } catch {
    return NextResponse.json({ error: 'Failed to parse packing list' }, { status: 500 })
  }
}

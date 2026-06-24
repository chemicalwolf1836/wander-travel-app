import { NextResponse } from 'next/server'
import { createHash } from 'crypto'
import Anthropic from '@anthropic-ai/sdk'
import { z } from 'zod'
import { createServerClient } from '@/lib/supabase/server'
import { rateLimit, clientIp } from '@/lib/rateLimit'
import type { Destination, Preferences } from '@/types'

const client = new Anthropic({
  baseURL: process.env.ANTHROPIC_PROXY_URL ?? 'https://api.anthropic.com',
})

const suggestSchema = z.object({
  preferences: z.object({
    summary: z.string(),
    climate: z.string(),
    budget: z.string(),
    travelStyle: z.string(),
    foodPreferences: z.string(),
    other: z.string(),
  }),
})

export async function POST(request: Request) {
  const limit = rateLimit(`suggest:${clientIp(request)}`, 10, 60_000)
  if (!limit.ok) {
    return NextResponse.json(
      { error: 'Too many requests. Please slow down.' },
      { status: 429, headers: { 'Retry-After': String(limit.retryAfter) } },
    )
  }

  const body: unknown = await request.json()
  const parsed = suggestSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }

  const { preferences } = parsed.data
  const supabase = createServerClient()

  // Compute hash first (sync, instant) so both DB queries can fire in parallel
  const hash = createHash('sha256').update(preferences.summary).digest('hex')
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

  const [{ data: countries }, { data: cached }] = await Promise.all([
    supabase
      .from('countries')
      .select(`
        id, name, code, region, flag_emoji, cultural_summary,
        best_seasons, visa_info, coordinates, currency,
        cities (
          id, name, latitude, longitude, description, travel_types, best_for,
          attractions (name, type, description)
        ),
        cuisines (summary, signature_dishes, dietary_options)
      `)
      .limit(20),
    supabase
      .from('suggestion_cache')
      .select('suggestions')
      .eq('preferences_hash', hash)
      .gte('created_at', oneDayAgo)
      .single(),
  ])

  if (cached?.suggestions) {
    return NextResponse.json(cached.suggestions)
  }

  // Step 3: Build prompt — use DB data when available, fall back to Claude's own knowledge
  const hasCountries = Array.isArray(countries) && countries.length > 0
  const systemPrompt = `You are Wander AI. Suggest exactly 3 travel destinations that best match the user preferences below.

IMPORTANT: All text fields (tagline, description, food summary, etc.) must use correct English spelling, grammar, and punctuation. Double-check proper nouns, place names, and cultural terms.

${hasCountries ? `Use the destination data below to ground your suggestions:\n${JSON.stringify(countries)}` : 'Use your knowledge of real-world destinations — choose diverse, compelling places from around the world.'}

User preferences: ${preferences.summary}

Respond with ONLY a valid JSON array of exactly 3 destinations using this schema per destination:
{
  "city": string,
  "country": string,
  "countryCode": string,
  "region": string,
  "flagEmoji": string,
  "tagline": string,
  "description": string,
  "coordinates": { "lat": number, "lng": number },
  "food": { "summary": string, "dishes": string[] },
  "attractions": string[],
  "bestFor": string[],
  "bestSeasons": string[],
  "emoji": string,
  "currency": string,
  "language": string,
  "visaInfo": string,
  "culturalTheme": {
    "primary": string,
    "accent": string,
    "background": string,
    "cardBg": string,
    "text": string,
    "mood": string
  }
}

No markdown. No extra text. Only the JSON array.`

  let response
  try {
    response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 4096,
      messages: [{ role: 'user', content: systemPrompt }],
    })
  } catch (err) {
    console.error('[suggest] Claude error:', err)
    return NextResponse.json(
      { error: 'The suggestion service is busy. Please try again in a moment.' },
      { status: 503 },
    )
  }

  const raw = response.content[0]?.type === 'text' ? response.content[0].text : '[]'
  const text = raw.replace(/^```(?:json)?\s*/m, '').replace(/\s*```\s*$/m, '').trim()

  let suggestions: Destination[]
  try {
    suggestions = JSON.parse(text)
  } catch {
    return NextResponse.json({ error: 'Failed to parse suggestions' }, { status: 500 })
  }

  // Guard against valid-JSON-but-wrong-shape replies (e.g. an object or empty array):
  // serving or caching those would break the results page for 24h.
  if (!Array.isArray(suggestions) || suggestions.length === 0) {
    return NextResponse.json({ error: 'No suggestions returned' }, { status: 502 })
  }

  // Step 4: Cache result
  await supabase
    .from('suggestion_cache')
    .upsert({ preferences_hash: hash, suggestions })

  return NextResponse.json(suggestions)
}

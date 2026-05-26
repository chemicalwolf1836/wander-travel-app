import { NextResponse } from 'next/server'
import { createHash } from 'crypto'
import Anthropic from '@anthropic-ai/sdk'
import { z } from 'zod'
import { createServerClient } from '@/lib/supabase/server'
import type { Destination, Preferences } from '@/types'

const client = new Anthropic()

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
  const body: unknown = await request.json()
  const parsed = suggestSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }

  const { preferences } = parsed.data
  const supabase = createServerClient()

  // Step 1: Fetch 20 candidate destinations from Supabase
  const { data: countries } = await supabase
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
    .limit(20)

  // Step 2: Check suggestion cache (valid for 24 hours)
  const hash = createHash('sha256').update(preferences.summary).digest('hex')
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

  const { data: cached } = await supabase
    .from('suggestion_cache')
    .select('suggestions')
    .eq('preferences_hash', hash)
    .gte('created_at', oneDayAgo)
    .single()

  if (cached?.suggestions) {
    return NextResponse.json(cached.suggestions)
  }

  // Step 3: Build prompt with real Supabase data
  const systemPrompt = `You are Wander AI. Use ONLY the real destination data provided below
to suggest exactly 3 destinations. Do not invent places. Choose the
3 best matches for the user preferences provided.

Available destinations: ${JSON.stringify(countries ?? [])}
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

  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 4096,
    messages: [{ role: 'user', content: systemPrompt }],
  })

  const raw = response.content[0].type === 'text' ? response.content[0].text : '[]'
  const text = raw.replace(/^```(?:json)?\s*/m, '').replace(/\s*```\s*$/m, '').trim()

  let suggestions: Destination[]
  try {
    suggestions = JSON.parse(text)
  } catch {
    return NextResponse.json({ error: 'Failed to parse suggestions' }, { status: 500 })
  }

  // Step 4: Cache result
  await supabase
    .from('suggestion_cache')
    .upsert({ preferences_hash: hash, suggestions })

  return NextResponse.json(suggestions)
}

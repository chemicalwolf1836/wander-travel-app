import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getAnthropic, extractText, parseClaudeJson, getCached, setCached } from '@/lib/ai'
import { rateLimit, clientIp } from '@/lib/rateLimit'

const schema = z.object({
  city: z.string().min(1).max(80),
  country: z.string().min(1).max(80),
  from: z.string().max(80).default(''),
})

export interface PriceEstimate {
  currency: string
  flight: { range: string; note: string } | null
  stays: { tier: string; perNight: string }[]
  tip: string
}

const WEEK_MS = 7 * 24 * 60 * 60 * 1000

export async function POST(req: Request) {
  const limit = rateLimit(`prices:${clientIp(req)}`, 20, 60_000)
  if (!limit.ok) {
    return NextResponse.json(
      { error: 'Too many requests. Please slow down.' },
      { status: 429, headers: { 'Retry-After': String(limit.retryAfter) } },
    )
  }

  const parsed = schema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ error: 'Invalid request' }, { status: 400 })

  const { city, country, from } = parsed.data
  const cacheKey = `${from.toLowerCase()}::${city.toLowerCase()}::${country.toLowerCase()}`
  const cached = await getCached<PriceEstimate>('prices', cacheKey, WEEK_MS)
  if (cached) return NextResponse.json(cached)

  let response
  try {
    response = await getAnthropic().messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 600,
      messages: [{
        role: 'user',
        content: `You are a travel pricing expert. Give typical price ranges for a trip to ${city}, ${country}${from ? ` from ${from}` : ''}.

Return ONLY a JSON object, no markdown:
{"currency":"USD","flight":${from ? '{"range":"$X–Y","note":"round trip, economy, under 10 words"}' : 'null'},"stays":[{"tier":"Hostel or budget","perNight":"$X–Y"},{"tier":"Mid-range hotel","perNight":"$X–Y"},{"tier":"Upscale hotel","perNight":"$X–Y"}],"tip":"one money-saving tip, under 18 words"}

Use USD. Ranges should reflect typical, not peak or rock-bottom, prices. Use correct English spelling and punctuation.`,
      }],
    })
  } catch (err) {
    console.error('[prices] Claude error:', err)
    return NextResponse.json({ error: 'The price service is busy. Please try again in a moment.' }, { status: 503 })
  }

  let estimate: PriceEstimate
  try {
    estimate = parseClaudeJson<PriceEstimate>(extractText(response))
  } catch {
    return NextResponse.json({ error: 'Failed to parse estimate' }, { status: 500 })
  }
  if (!estimate || !Array.isArray(estimate.stays) || estimate.stays.length === 0) {
    return NextResponse.json({ error: 'No estimate returned' }, { status: 502 })
  }

  await setCached('prices', cacheKey, estimate)
  return NextResponse.json(estimate)
}

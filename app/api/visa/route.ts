import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getAnthropic, extractText, parseClaudeJson, getCached, setCached } from '@/lib/ai'
import { rateLimit, clientIp } from '@/lib/rateLimit'

const schema = z.object({
  passport: z.string().regex(/^[A-Z]{2}$/),
  passportName: z.string().min(1).max(80),
  country: z.string().min(1).max(80),
})

export const VISA_REQUIREMENTS = ['none', 'on-arrival', 'e-visa', 'required', 'unknown'] as const

export interface VisaInfo {
  requirement: (typeof VISA_REQUIREMENTS)[number]
  summary: string
  maxStay: string
  advisory: { level: 1 | 2 | 3 | 4 | null; summary: string }
}

const WEEK_MS = 7 * 24 * 60 * 60 * 1000

export async function POST(req: Request) {
  const limit = rateLimit(`visa:${clientIp(req)}`, 20, 60_000)
  if (!limit.ok) {
    return NextResponse.json(
      { error: 'Too many requests. Please slow down.' },
      { status: 429, headers: { 'Retry-After': String(limit.retryAfter) } },
    )
  }

  const parsed = schema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ error: 'Invalid request' }, { status: 400 })

  const { passport, passportName, country } = parsed.data
  const cacheKey = `${passport}::${country.toLowerCase()}`
  const cached = await getCached<VisaInfo>('visa', cacheKey, WEEK_MS)
  if (cached) return NextResponse.json(cached)

  let response
  try {
    response = await getAnthropic().messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 500,
      messages: [{
        role: 'user',
        content: `You are a travel documents expert. A tourist holding a ${passportName} passport wants to visit ${country} for a short holiday.

Return ONLY a JSON object, no markdown:
{"requirement":"none|on-arrival|e-visa|required|unknown","summary":"what they need, under 30 words","maxStay":"e.g. 30 days, or empty if unknown","advisory":{"level":1,"summary":"general safety picture for tourists, under 25 words"}}

"requirement" must be one of: none, on-arrival, e-visa, required, unknown. "advisory.level" is 1 (normal precautions) to 4 (do not travel), or null if unsure. If you are not confident, use "unknown" rather than guessing. Use correct English spelling and punctuation.`,
      }],
    })
  } catch (err) {
    console.error('[visa] Claude error:', err)
    return NextResponse.json({ error: 'The visa service is busy. Please try again in a moment.' }, { status: 503 })
  }

  let info: VisaInfo
  try {
    info = parseClaudeJson<VisaInfo>(extractText(response))
  } catch {
    return NextResponse.json({ error: 'Failed to parse visa info' }, { status: 500 })
  }
  if (!info || !VISA_REQUIREMENTS.includes(info.requirement) || typeof info.summary !== 'string') {
    return NextResponse.json({ error: 'No visa info returned' }, { status: 502 })
  }

  await setCached('visa', cacheKey, info)
  return NextResponse.json(info)
}

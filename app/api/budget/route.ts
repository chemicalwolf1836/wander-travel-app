import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getAnthropic, extractText, parseClaudeJson, getCached, setCached } from '@/lib/ai'
import { rateLimit, clientIp } from '@/lib/rateLimit'

const schema = z.object({
  city: z.string(),
  country: z.string(),
  style: z.enum(['budget', 'mid', 'luxury']).default('mid'),
})

export interface BudgetCategory {
  name: string
  cost: string
  note: string
}
export interface BudgetEstimate {
  currency: string
  dailyTotal: string
  categories: BudgetCategory[]
}

const STYLE_LABEL: Record<string, string> = {
  budget: 'budget-conscious backpacker',
  mid: 'comfortable mid-range',
  luxury: 'high-end luxury',
}

export async function POST(req: Request) {
  const limit = rateLimit(`budget:${clientIp(req)}`, 20, 60_000)
  if (!limit.ok) {
    return NextResponse.json(
      { error: 'Too many requests. Please slow down.' },
      { status: 429, headers: { 'Retry-After': String(limit.retryAfter) } },
    )
  }

  const body: unknown = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Invalid request' }, { status: 400 })

  const { city, country, style } = parsed.data
  const cacheKey = `${city}::${style}`

  const cached = await getCached<BudgetEstimate>('budget', cacheKey)
  if (cached) return NextResponse.json(cached)

  let response
  try {
    response = await getAnthropic().messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 700,
      messages: [{
        role: 'user',
        content: `You are a travel budget expert. Estimate typical daily costs for a ${STYLE_LABEL[style]} traveller in ${city}, ${country}.

Return ONLY a JSON object, no markdown, no explanation:
{"currency":"USD","dailyTotal":"$X–Y","categories":[{"name":"Accommodation","cost":"$X–Y","note":"short note"}]}

Include exactly these categories in order: Accommodation, Food & Drink, Transport, Activities, Miscellaneous. Use a local-relevant currency code. Keep notes under 8 words. Use correct English spelling and punctuation.`,
      }],
    })
  } catch (err) {
    console.error('[budget] Claude error:', err)
    return NextResponse.json(
      { error: 'The budget service is busy. Please try again in a moment.' },
      { status: 503 },
    )
  }

  let estimate: BudgetEstimate
  try {
    estimate = parseClaudeJson<BudgetEstimate>(extractText(response))
  } catch {
    return NextResponse.json({ error: 'Failed to parse budget estimate' }, { status: 500 })
  }

  if (!estimate || !Array.isArray(estimate.categories) || estimate.categories.length === 0) {
    return NextResponse.json({ error: 'No estimate returned' }, { status: 502 })
  }

  await setCached('budget', cacheKey, estimate)
  return NextResponse.json(estimate)
}

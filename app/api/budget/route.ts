import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { z } from 'zod'

const client = new Anthropic()

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

const cache = new Map<string, BudgetEstimate>()

const STYLE_LABEL: Record<string, string> = {
  budget: 'budget-conscious backpacker',
  mid: 'comfortable mid-range',
  luxury: 'high-end luxury',
}

export async function POST(req: Request) {
  const body: unknown = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Invalid request' }, { status: 400 })

  const { city, country, style } = parsed.data
  const cacheKey = `${city}::${style}`
  if (cache.has(cacheKey)) return NextResponse.json(cache.get(cacheKey))

  let response
  try {
    response = await client.messages.create({
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

  const raw = response.content[0]?.type === 'text' ? response.content[0].text.trim() : '{}'
  const text = raw.replace(/^```(?:json)?\s*/m, '').replace(/\s*```\s*$/m, '').trim()

  try {
    const estimate = JSON.parse(text) as BudgetEstimate
    if (!estimate || !Array.isArray(estimate.categories) || estimate.categories.length === 0) {
      return NextResponse.json({ error: 'No estimate returned' }, { status: 502 })
    }
    cache.set(cacheKey, estimate)
    return NextResponse.json(estimate)
  } catch {
    return NextResponse.json({ error: 'Failed to parse budget estimate' }, { status: 500 })
  }
}

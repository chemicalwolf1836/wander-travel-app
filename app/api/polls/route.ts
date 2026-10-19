import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createServerClient } from '@/lib/supabase/server'
import { rateLimit, clientIp } from '@/lib/rateLimit'
import { newPollId, MAX_OPTIONS } from '@/lib/polls'

const optionSchema = z.object({
  city: z.string().min(1).max(80),
  country: z.string().max(80),
  countryCode: z.string().max(3),
  flagEmoji: z.string().max(16),
  tagline: z.string().max(300),
})

const schema = z.object({
  title: z.string().trim().min(1).max(100),
  options: z.array(optionSchema).min(2).max(MAX_OPTIONS),
})

// Creates a poll from a shortlist of saved places; returns its id.
export async function POST(req: Request) {
  const limit = rateLimit(`polls:${clientIp(req)}`, 10, 60_000)
  if (!limit.ok) {
    return NextResponse.json(
      { error: 'Too many requests. Please slow down.' },
      { status: 429, headers: { 'Retry-After': String(limit.retryAfter) } },
    )
  }

  const parsed = schema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ error: 'Invalid request' }, { status: 400 })

  const id = newPollId()
  const { error } = await createServerClient()
    .from('polls')
    .insert({ id, title: parsed.data.title, options: parsed.data.options })
  if (error) {
    console.error('[polls] create failed:', error)
    return NextResponse.json({ error: 'Could not create the poll' }, { status: 500 })
  }
  return NextResponse.json({ id })
}

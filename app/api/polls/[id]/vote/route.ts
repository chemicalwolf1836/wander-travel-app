import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createServerClient } from '@/lib/supabase/server'
import { rateLimit, clientIp } from '@/lib/rateLimit'
import { cleanChoices, MAX_OPTIONS, type PollOption } from '@/lib/polls'

const schema = z.object({
  voterId: z.string().uuid(),
  name: z.string().trim().min(1).max(40),
  choices: z.array(z.string().max(80)).max(MAX_OPTIONS),
})

// Adds or replaces one voter's picks (a voter is a browser, by random id).
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const limit = rateLimit(`vote:${clientIp(req)}`, 30, 60_000)
  if (!limit.ok) {
    return NextResponse.json(
      { error: 'Too many requests. Please slow down.' },
      { status: 429, headers: { 'Retry-After': String(limit.retryAfter) } },
    )
  }

  const { id } = await params
  const parsed = schema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ error: 'Invalid request' }, { status: 400 })

  const supabase = createServerClient()
  const { data: poll } = await supabase.from('polls').select('options').eq('id', id).maybeSingle()
  if (!poll) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const { voterId, name, choices } = parsed.data
  const { error } = await supabase.from('poll_votes').upsert({
    poll_id: id,
    voter_id: voterId,
    voter_name: name,
    choices: cleanChoices(poll.options as PollOption[], choices),
    updated_at: new Date().toISOString(),
  })
  if (error) {
    console.error('[vote] save failed:', error)
    return NextResponse.json({ error: 'Could not save your vote' }, { status: 500 })
  }
  return NextResponse.json({ ok: true })
}

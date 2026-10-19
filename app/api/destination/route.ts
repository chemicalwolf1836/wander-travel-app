import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createServerClient } from '@/lib/supabase/server'
import { rateLimit, clientIp } from '@/lib/rateLimit'
import { destinationSchema } from '@/lib/destinationSchema'
import { destinationSlug } from '@/lib/sharedDestinations'

const schema = z.object({ destination: destinationSchema })

// Stores a destination so its /destination/<city> link works for anyone.
// First write wins: an existing entry is never overwritten, so a shared link
// can't be repointed at different content later.
export async function POST(req: Request) {
  const limit = rateLimit(`destination:${clientIp(req)}`, 30, 60_000)
  if (!limit.ok) {
    return NextResponse.json(
      { error: 'Too many requests. Please slow down.' },
      { status: 429, headers: { 'Retry-After': String(limit.retryAfter) } },
    )
  }

  const parsed = schema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ error: 'Invalid request' }, { status: 400 })

  const { destination } = parsed.data
  try {
    const supabase = createServerClient()
    const { error } = await supabase
      .from('shared_destinations')
      .upsert(
        { slug: destinationSlug(destination.city), data: destination },
        { onConflict: 'slug', ignoreDuplicates: true },
      )
    if (error) throw error
  } catch (err) {
    console.error('[destination] store failed:', err)
    return NextResponse.json({ error: 'Could not save' }, { status: 500 })
  }
  return NextResponse.json({ ok: true })
}

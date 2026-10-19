import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import type { Poll, PollOption } from '@/lib/polls'

// A poll with everyone's votes (names and picks are visible to all voters).
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = createServerClient()
  const [{ data: poll }, { data: votes }] = await Promise.all([
    supabase.from('polls').select('id, title, options').eq('id', id).maybeSingle(),
    supabase.from('poll_votes').select('voter_name, choices').eq('poll_id', id).order('updated_at'),
  ])
  if (!poll) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const body: Poll = {
    id: poll.id,
    title: poll.title,
    options: poll.options as PollOption[],
    votes: (votes ?? []).map(v => ({ name: v.voter_name as string, choices: v.choices as string[] })),
  }
  return NextResponse.json(body, { headers: { 'Cache-Control': 'no-store' } })
}

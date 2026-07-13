import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getAnthropic, extractText, stripFences } from '@/lib/ai'
import { rateLimit, clientIp } from '@/lib/rateLimit'

const chatSchema = z.object({
  messages: z.array(
    z.object({
      role: z.enum(['user', 'assistant']),
      content: z.string(),
    })
  ),
})

const SYSTEM_PROMPT = `You are Wander, a travel concierge. Be brief — one or two sentences maximum per reply. Never list questions or bullet points. Use correct English spelling, grammar, and punctuation in every reply.

If the user gives any meaningful signal (a vibe, a climate, a mood, a style — even just one thing), that is enough to search. Don't interrogate. If you need one thing more, ask only that one thing.

When ready to search, respond with this JSON only:
{"ready":true,"message":"one short send-off line","preferences":{"summary":"plain text summary of what the user wants","climate":"","budget":"","travelStyle":"","foodPreferences":"","other":""}}

While still chatting:
{"ready":false,"message":"your brief reply"}

JSON only. No markdown. No extra text.`

export async function POST(request: Request) {
  const limit = rateLimit(`chat:${clientIp(request)}`, 20, 60_000)
  if (!limit.ok) {
    return NextResponse.json(
      { error: 'Too many requests. Please slow down.' },
      { status: 429, headers: { 'Retry-After': String(limit.retryAfter) } },
    )
  }

  const body: unknown = await request.json()
  const parsed = chatSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }

  const { messages } = parsed.data

  let response
  try {
    response = await getAnthropic().messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 300,
      system: SYSTEM_PROMPT,
      messages,
    })
  } catch (err) {
    console.error('[chat] Claude error:', err)
    return NextResponse.json(
      { error: 'The chat service is busy. Please try again in a moment.' },
      { status: 503 },
    )
  }

  const raw = extractText(response)

  // Claude is instructed to return JSON, but occasionally responds in plain text.
  // If parsing fails, treat the response as a conversational message and continue.
  try {
    const parsed: unknown = JSON.parse(stripFences(raw))
    return NextResponse.json(parsed)
  } catch {
    return NextResponse.json({ ready: false, message: raw })
  }
}

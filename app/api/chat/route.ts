import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { z } from 'zod'

const client = new Anthropic()

const chatSchema = z.object({
  messages: z.array(
    z.object({
      role: z.enum(['user', 'assistant']),
      content: z.string(),
    })
  ),
  mode: z.enum(['free', 'guided']).optional().default('free'),
})

const BASE_PROMPT = `You are Wander, a travel concierge. Be brief — one or two sentences maximum per reply. Never list questions or bullet points.

If the user gives any meaningful signal (a vibe, a climate, a mood, a style — even just one thing), that is enough to search. Don't interrogate. If you need one thing more, ask only that one thing.

When ready to search, respond with this JSON only:
{"ready":true,"message":"one short send-off line","preferences":{"summary":"plain text summary of what the user wants","climate":"","budget":"","travelStyle":"","foodPreferences":"","other":""}}

While still chatting:
{"ready":false,"message":"your brief reply"}

JSON only. No markdown. No extra text.`

const GUIDED_SUFFIX = ` Also add "choices": an array of 3–4 short tappable options (max 4 words each) that answer your question. Example: {"ready":false,"message":"What kind of climate?","choices":["Warm and tropical","Cold and dramatic","Dry and sunny","Mild and green"]}`

const SYSTEM_PROMPT = BASE_PROMPT
const GUIDED_PROMPT = BASE_PROMPT + GUIDED_SUFFIX

export async function POST(request: Request) {
  const body: unknown = await request.json()
  const parsed = chatSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }

  const { messages, mode } = parsed.data

  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 300,
    system: mode === 'guided' ? GUIDED_PROMPT : SYSTEM_PROMPT,
    messages,
  })

  const raw = response.content[0].type === 'text' ? response.content[0].text : ''

  // Strip markdown code fences Claude sometimes wraps around JSON
  const text = raw.replace(/^```(?:json)?\s*/m, '').replace(/\s*```\s*$/m, '').trim()

  // Claude is instructed to return JSON, but occasionally responds in plain text.
  // If parsing fails, treat the response as a conversational message and continue.
  try {
    const parsed: unknown = JSON.parse(text)
    return NextResponse.json(parsed)
  } catch {
    return NextResponse.json({ ready: false, message: raw.trim() })
  }
}

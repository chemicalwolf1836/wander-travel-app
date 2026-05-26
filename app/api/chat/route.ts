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
})

const SYSTEM_PROMPT = `You are Wander AI, a luxury travel concierge. Your tone is warm,
knowledgeable, and inspiring - like a well-traveled friend.

Ask natural follow-up questions if the user is vague about climate,
budget, travel style, or food preferences. You need at least some
sense of these before suggesting destinations.

Once you have enough context, respond ONLY with this JSON and nothing else:
{
  "ready": true,
  "message": "your warm closing message here",
  "preferences": {
    "summary": "full plain-text summary of all gathered preferences",
    "climate": "",
    "budget": "",
    "travelStyle": "",
    "foodPreferences": "",
    "other": ""
  }
}

Until you have enough context respond with:
{
  "ready": false,
  "message": "your conversational response here"
}

Always respond with valid JSON only. No markdown. No extra text.`

export async function POST(request: Request) {
  const body: unknown = await request.json()
  const parsed = chatSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }

  const { messages } = parsed.data

  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1024,
    system: SYSTEM_PROMPT,
    messages,
  })

  const text = response.content[0].type === 'text' ? response.content[0].text : ''

  // Claude is instructed to return JSON, but occasionally responds in plain text.
  // If parsing fails, treat the response as a conversational message and continue.
  try {
    const parsed: unknown = JSON.parse(text)
    return NextResponse.json(parsed)
  } catch {
    return NextResponse.json({ ready: false, message: text })
  }
}

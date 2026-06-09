import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic()

// Server-side cache — survives across requests within the same serverless instance
const serverCache = new Map<string, { data: ReturnType<typeof makePayload>; ts: number }>()
const CACHE_TTL = 10 * 60 * 1000 // 10 minutes

function makePayload(name: string, description: string, image: string | null) {
  return { name, description, image }
}

const STOP_WORDS = new Set([
  'the','and','for','air','top','best','high','end','world','class',
  'style','type','scene','life','city','local','famous','iconic','with',
])

function stem(w: string) {
  return w.replace(/ies$/, 'y').replace(/ses$/, 's').replace(/s$/, '').replace(/ing$/, '').replace(/ed$/, '')
}

function meaningful(s: string): string[] {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .split(/\s+/)
    .filter(w => w.length > 3 && !STOP_WORDS.has(w))
}

function isRelevant(searchTerm: string, wikiTitle: string): boolean {
  const searchWords = meaningful(searchTerm)
  const titleStr    = wikiTitle.toLowerCase().replace(/[^a-z0-9\s]/g, '')
  if (searchWords.length === 0) return false
  const matches = searchWords.filter(w => {
    const ws = stem(w)
    return titleStr.split(/\s+/).some(t => stem(t) === ws || (t.includes(ws) && ws.length >= 5))
  })
  const hasSignificant = matches.some(w => w.length >= 5)
  return hasSignificant && matches.length / searchWords.length >= 0.5
}

async function getCommonsImage(query: string): Promise<string | null> {
  try {
    const url = `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrnamespace=6&gsrsearch=${encodeURIComponent(query)}&prop=imageinfo&iiprop=url&format=json&origin=*&gsrlimit=8`
    const data = await fetch(url).then(r => r.json())
    const pages = Object.values(data?.query?.pages ?? {}) as Array<{ imageinfo?: Array<{ url: string }> }>
    for (const page of pages) {
      const imgUrl = page.imageinfo?.[0]?.url ?? ''
      if (imgUrl && /\.(jpe?g|png|webp)$/i.test(imgUrl)) return imgUrl
    }
  } catch { /* optional */ }
  return null
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const name    = searchParams.get('name')
  const context = searchParams.get('context') ?? ''
  if (!name) return NextResponse.json({ error: 'Missing name' }, { status: 400 })

  const cacheKey = `${name}::${context}`
  const cached = serverCache.get(cacheKey)
  if (cached && Date.now() - cached.ts < CACHE_TTL) {
    return NextResponse.json(cached.data)
  }

  let description = ''
  let image: string | null = null

  // ── Step 1: Wikipedia search + Commons image search in parallel ─────────────
  const [wikiSearch, commonsContextImage] = await Promise.all([
    fetch(
      `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(name)}&format=json&origin=*&srlimit=1`
    ).then(r => r.json()).catch(() => null),
    getCommonsImage(`${name} ${context}`),
  ])

  // ── Step 2: Wikipedia summary (only if search returned a relevant title) ────
  const wikiTitle = wikiSearch?.query?.search?.[0]?.title
  if (wikiTitle && isRelevant(name, wikiTitle)) {
    try {
      const summary = await fetch(
        `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(wikiTitle)}`
      ).then(r => r.json())
      const sentences = (summary?.extract ?? '').match(/[^.!?]+[.!?]+/g) ?? []
      description = sentences.slice(0, 3).join(' ').trim()
      image = summary?.originalimage?.source ?? summary?.thumbnail?.source ?? null
    } catch { /* optional */ }
  }

  // ── Step 3: Use Commons result (already fetched); fall back to name-only ────
  if (!image) {
    image = commonsContextImage ?? await getCommonsImage(name)
  }

  // ── Step 4: Claude for text (only when Wikipedia wasn't relevant) ────────────
  if (!description) {
    try {
      const response = await anthropic.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 220,
        messages: [{
          role: 'user',
          content: `You are a luxury travel writer. Write 2-3 vivid, atmospheric sentences about "${name}"${context ? ` in the context of ${context}` : ''}. Be specific, sensory, and enticing. No intro phrase, just dive straight in. Use correct English spelling, grammar, and punctuation throughout.`,
        }],
      })
      description = response.content[0]?.type === 'text' ? response.content[0].text.trim() : ''
    } catch (err) {
      // Enrichment is optional — keep any image we already found and return without a description.
      console.error('[item-info] Claude error:', err)
    }
  }

  const data = makePayload(name, description, image)
  serverCache.set(cacheKey, { data, ts: Date.now() })
  return NextResponse.json(data)
}

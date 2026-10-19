import { NextResponse } from 'next/server'
import { getAnthropic, extractText } from '@/lib/ai'
import { rateLimit, clientIp } from '@/lib/rateLimit'
import { wikiFetch } from '@/lib/wikimedia'

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

// File titles that are never a photo of the thing itself.
const NOT_A_PHOTO = /\bmap\b|locator|location.?map|\bflag\b|coat.?of.?arms|\blogo\b|emblem|\bseal\b|diagram|\bicon\b|stamp|banknote|signature/i

/**
 * First Commons photo whose file title actually names `subject`, in search-rank
 * order. Without the title check the top hit for "<dish> <city>" is often an
 * unrelated photo that merely mentions the words in its description.
 */
async function getCommonsImage(query: string, subject: string): Promise<string | null> {
  try {
    const url = `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrnamespace=6&gsrsearch=${encodeURIComponent(query)}&prop=imageinfo&iiprop=url|mime&iiurlwidth=1080&format=json&origin=*&gsrlimit=12`
    const data = await wikiFetch(url).then(r => r.json())
    const pages = (Object.values(data?.query?.pages ?? {}) as Array<{
      title?: string
      index?: number
      imageinfo?: Array<{ url: string; thumburl?: string; mime?: string }>
    }>).sort((a, b) => (a.index ?? 99) - (b.index ?? 99))
    for (const page of pages) {
      const info = page.imageinfo?.[0]
      const title = (page.title ?? '').replace(/^File:/, '').replace(/\.[a-z]+$/i, '')
      if (!info || !/^image\/(jpeg|png|webp)$/.test(info.mime ?? '')) continue
      if (NOT_A_PHOTO.test(title) || !isRelevant(subject, title)) continue
      return info.thumburl ?? info.url
    }
  } catch { /* optional */ }
  return null
}

export async function GET(req: Request) {
  const limit = rateLimit(`item-info:${clientIp(req)}`, 60, 60_000)
  if (!limit.ok) {
    return NextResponse.json(
      { error: 'Too many requests. Please slow down.' },
      { status: 429, headers: { 'Retry-After': String(limit.retryAfter) } },
    )
  }

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
    wikiFetch(`https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(name)}&format=json&origin=*&srlimit=1`
    ).then(r => r.json()).catch(() => null),
    getCommonsImage(`${name} ${context}`, name),
  ])

  // ── Step 2: Wikipedia summary (only if search returned a relevant title) ────
  const wikiTitle = wikiSearch?.query?.search?.[0]?.title
  if (wikiTitle && isRelevant(name, wikiTitle)) {
    try {
      const summary = await wikiFetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(wikiTitle)}`
      ).then(r => r.json())
      const sentences = (summary?.extract ?? '').match(/[^.!?]+[.!?]+/g) ?? []
      description = sentences.slice(0, 3).join(' ').trim()
      image = summary?.originalimage?.source ?? summary?.thumbnail?.source ?? null
    } catch { /* optional */ }
  }

  // ── Step 3: Use Commons result (already fetched); fall back to name-only ────
  if (!image) {
    image = commonsContextImage ?? await getCommonsImage(name, name)
  }

  // ── Step 4: Claude for text (only when Wikipedia wasn't relevant) ────────────
  if (!description) {
    try {
      const response = await getAnthropic().messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 220,
        messages: [{
          role: 'user',
          content: `You are a luxury travel writer. Write 2-3 vivid, atmospheric sentences about "${name}"${context ? ` in the context of ${context}` : ''}. Be specific, sensory, and enticing. No intro phrase, just dive straight in. Use correct English spelling, grammar, and punctuation throughout.`,
        }],
      })
      description = extractText(response)
    } catch (err) {
      // Enrichment is optional — keep any image we already found and return without a description.
      console.error('[item-info] Claude error:', err)
    }
  }

  const data = makePayload(name, description, image)
  serverCache.set(cacheKey, { data, ts: Date.now() })
  return NextResponse.json(data)
}

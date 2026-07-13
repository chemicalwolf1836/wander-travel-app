import Anthropic from '@anthropic-ai/sdk'
import { createServerClient } from '@/lib/supabase/server'

// Single shared Anthropic client for every AI route, created lazily so merely
// importing this module (e.g. for the pure helpers below, or in tests) has no
// side effects. Honors ANTHROPIC_PROXY_URL (used in some deploys) and falls
// back to the public API.
let _anthropic: Anthropic | null = null
export function getAnthropic(): Anthropic {
  if (!_anthropic) {
    _anthropic = new Anthropic({
      baseURL: process.env.ANTHROPIC_PROXY_URL ?? 'https://api.anthropic.com',
    })
  }
  return _anthropic
}

/** Pull the first text block out of a Claude message (trimmed; '' if none). */
export function extractText(response: { content: Array<{ type: string; text?: string }> }): string {
  const block = response.content[0]
  return block?.type === 'text' ? (block.text ?? '').trim() : ''
}

/** Strip the ```json … ``` markdown fences Claude sometimes wraps around JSON. */
export function stripFences(raw: string): string {
  return raw.replace(/^```(?:json)?\s*/m, '').replace(/\s*```\s*$/m, '').trim()
}

/** Distinguishes a JSON.parse failure ('parse') from a valid-JSON-wrong-shape reply ('shape'). */
export class ClaudeJsonError extends Error {
  constructor(public reason: 'parse' | 'shape') {
    super(`claude-json:${reason}`)
    this.name = 'ClaudeJsonError'
  }
}

/**
 * Parse Claude's JSON output. Strips markdown fences first. With
 * `expectArray`, also rejects non-arrays and empty arrays (serving or caching
 * those would break the UI). Throws ClaudeJsonError so callers can map the
 * failure to the right status code.
 */
export function parseClaudeJson<T>(raw: string, opts: { expectArray?: boolean } = {}): T {
  let data: unknown
  try {
    data = JSON.parse(stripFences(raw))
  } catch {
    throw new ClaudeJsonError('parse')
  }
  if (opts.expectArray && (!Array.isArray(data) || data.length === 0)) {
    throw new ClaudeJsonError('shape')
  }
  return data as T
}

const DEFAULT_MAX_AGE_MS = 24 * 60 * 60 * 1000 // 24h, matching the suggest cache

/**
 * Read a cached AI result from the shared `ai_cache` table, if it exists and is
 * fresher than `maxAgeMs`. Best-effort: any failure (missing table, DB error)
 * returns null so the route simply regenerates instead of erroring.
 */
export async function getCached<T>(
  kind: string,
  key: string,
  maxAgeMs: number = DEFAULT_MAX_AGE_MS,
): Promise<T | null> {
  try {
    const supabase = createServerClient()
    const since = new Date(Date.now() - maxAgeMs).toISOString()
    const { data } = await supabase
      .from('ai_cache')
      .select('value')
      .eq('kind', kind)
      .eq('cache_key', key)
      .gte('created_at', since)
      .single()
    return (data?.value as T) ?? null
  } catch {
    return null
  }
}

/**
 * Write an AI result to the shared `ai_cache` table. Best-effort — a failed
 * cache write must never fail the request, so errors are swallowed.
 */
export async function setCached(kind: string, key: string, value: unknown): Promise<void> {
  try {
    const supabase = createServerClient()
    await supabase
      .from('ai_cache')
      .upsert(
        { kind, cache_key: key, value, created_at: new Date().toISOString() },
        { onConflict: 'kind,cache_key' },
      )
  } catch {
    /* best-effort */
  }
}

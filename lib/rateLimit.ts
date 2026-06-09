// Lightweight in-memory rate limiter for the public AI routes.
//
// Caveat: this lives inside a single serverless instance, so the count resets on
// a cold start and is not shared across instances. It stops casual hammering from
// one source (the common case) but is not a distributed guarantee. When the app
// gets real traffic, swap the Map for @upstash/ratelimit (Redis) — the call site
// in the route stays the same.

type Hit = { count: number; resetAt: number }

const buckets = new Map<string, Hit>()

export interface RateLimitResult {
  ok: boolean
  /** Seconds until the window resets — useful for a Retry-After header. */
  retryAfter: number
}

/**
 * Fixed-window limiter: allow `limit` requests per `windowMs` per key.
 * Returns whether the request is allowed and when the window resets.
 */
export function rateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now()
  const hit = buckets.get(key)

  if (!hit || now >= hit.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs })
    return { ok: true, retryAfter: 0 }
  }

  hit.count++
  if (hit.count > limit) {
    return { ok: false, retryAfter: Math.ceil((hit.resetAt - now) / 1000) }
  }
  return { ok: true, retryAfter: 0 }
}

/** Best-effort client IP from proxy headers (Vercel sets x-forwarded-for). */
export function clientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) return forwarded.split(',')[0].trim()
  return request.headers.get('x-real-ip') ?? 'unknown'
}

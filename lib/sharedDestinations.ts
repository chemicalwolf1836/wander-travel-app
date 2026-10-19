import type { Destination } from '@/types'

/** Normalised key for a destination's shareable URL: "Cape Town" → "cape town". */
export function destinationSlug(city: string): string {
  return city.trim().toLowerCase().replace(/\s+/g, ' ')
}

/**
 * Store a destination server-side so its /destination/<city> link opens on any
 * device. Fire-and-forget: a failure only means the link stays local-only.
 */
export function publishDestination(dest: Destination): void {
  if (typeof window === 'undefined') return
  fetch('/api/destination', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ destination: dest }),
    keepalive: true,
  }).catch(() => { /* best-effort */ })
}

/** Look up a destination someone shared. Null when unknown or offline. */
export async function fetchSharedDestination(city: string): Promise<Destination | null> {
  try {
    const res = await fetch(`/api/destination/${encodeURIComponent(city)}`)
    if (!res.ok) return null
    return (await res.json()) as Destination
  } catch {
    return null
  }
}

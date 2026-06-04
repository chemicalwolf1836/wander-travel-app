'use client'

import { useEffect, useState } from 'react'

export interface DestinationImage {
  src: string
  /** Smaller variant for thumbnails / fast first paint (falls back to src). */
  thumb: string
}

// Module-level caches so a city is fetched once per session and re-used
// instantly across Results, Saved, and Destination detail.
const cache = new Map<string, DestinationImage | null>()
const inflight = new Map<string, Promise<DestinationImage | null>>()

async function fetchImage(city: string): Promise<DestinationImage | null> {
  try {
    const res = await fetch(
      `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(city)}`
    )
    if (res.ok) {
      const d: { originalimage?: { source: string }; thumbnail?: { source: string } } = await res.json()
      const full = d.originalimage?.source ?? d.thumbnail?.source ?? null
      const small = d.thumbnail?.source ?? d.originalimage?.source ?? null
      if (full) return { src: full, thumb: small ?? full }
    }
  } catch {
    /* ignore — no image is fine */
  }
  return null
}

export function useDestinationImage(city: string, country = ''): DestinationImage | null {
  // country kept in the cache key so callers can pass it without churn
  const key = `${city}|${country}`.toLowerCase()
  const [image, setImage] = useState<DestinationImage | null>(() => cache.get(key) ?? null)

  useEffect(() => {
    if (cache.has(key)) {
      setImage(cache.get(key) ?? null)
      return
    }
    let active = true
    const promise = inflight.get(key) ?? fetchImage(city)
    inflight.set(key, promise)
    promise.then((result) => {
      cache.set(key, result)
      inflight.delete(key)
      if (active) setImage(result)
    })
    return () => {
      active = false
    }
  }, [key, city])

  return image
}

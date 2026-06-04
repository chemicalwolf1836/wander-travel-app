'use client'

import { useEffect, useState } from 'react'

export interface DestinationImage {
  src: string
  /** Present only for Unsplash photos (required attribution). */
  credit?: { name: string; link: string }
}

// Module-level caches so a city is fetched once per session and re-used
// instantly across Results, Saved, and Destination detail.
const cache = new Map<string, DestinationImage | null>()
const inflight = new Map<string, Promise<DestinationImage | null>>()

async function fetchImage(city: string, country: string): Promise<DestinationImage | null> {
  // 1) Unsplash via our server route (key stays server-side; returns null if
  //    no key is configured or no match — so we transparently fall back).
  try {
    const res = await fetch(
      `/api/photo?city=${encodeURIComponent(city)}&country=${encodeURIComponent(country)}`
    )
    if (res.ok) {
      const data: { url?: string; credit?: { name: string; link: string } } | null = await res.json()
      if (data?.url) return { src: data.url, credit: data.credit }
    }
  } catch {
    /* fall through to Wikipedia */
  }

  // 2) Wikipedia fallback (free, no key) — same source Results used before.
  try {
    const res = await fetch(
      `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(city)}`
    )
    if (res.ok) {
      const d: { originalimage?: { source: string }; thumbnail?: { source: string } } = await res.json()
      const url = d.originalimage?.source ?? d.thumbnail?.source ?? null
      if (url) return { src: url }
    }
  } catch {
    /* ignore */
  }

  return null
}

export function useDestinationImage(city: string, country = ''): DestinationImage | null {
  const key = `${city}|${country}`.toLowerCase()
  const [image, setImage] = useState<DestinationImage | null>(() => cache.get(key) ?? null)

  useEffect(() => {
    if (cache.has(key)) {
      setImage(cache.get(key) ?? null)
      return
    }
    let active = true
    const promise = inflight.get(key) ?? fetchImage(city, country)
    inflight.set(key, promise)
    promise.then((result) => {
      cache.set(key, result)
      inflight.delete(key)
      if (active) setImage(result)
    })
    return () => {
      active = false
    }
  }, [key, city, country])

  return image
}

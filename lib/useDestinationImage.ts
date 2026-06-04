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

// Reject non-photographic lead images so we never show a coat of arms,
// flag, locator map, seal, or logo instead of an actual photo of the place.
function isPhoto(url: string): boolean {
  if (/\.svg(\?|$)/i.test(url)) return false
  return !/coat_of_arms|coats?_of_arms|\bflag\b|flag_of|locator|location_map|_map[_.]|\bmap\b|\bseal\b|emblem|\blogo\b|wappen|escudo|bandera/i.test(url)
}

// 1) Search Wikipedia for "<city> <country>" so we land on the RIGHT article
//    (avoids name collisions), and take that article's representative lead
//    image — which for places is almost always a real photo.
async function fetchFromSearch(city: string, country: string): Promise<DestinationImage | null> {
  const q = `${city} ${country}`.trim()
  const url =
    `https://en.wikipedia.org/w/api.php?action=query&format=json&origin=*` +
    `&generator=search&gsrsearch=${encodeURIComponent(q)}&gsrlimit=1` +
    `&prop=pageimages&piprop=original|thumbnail&pithumbsize=400`
  const res = await fetch(url)
  if (!res.ok) return null
  const data: {
    query?: { pages?: Record<string, { original?: { source: string }; thumbnail?: { source: string } }> }
  } = await res.json()
  const page = data.query?.pages ? Object.values(data.query.pages)[0] : undefined
  const full = page?.original?.source ?? page?.thumbnail?.source ?? null
  const small = page?.thumbnail?.source ?? page?.original?.source ?? null
  if (full && isPhoto(full)) return { src: full, thumb: small ?? full }
  return null
}

// 2) Backup: the page summary for the city name (also photo-filtered).
async function fetchFromSummary(city: string): Promise<DestinationImage | null> {
  const res = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(city)}`)
  if (!res.ok) return null
  const d: { originalimage?: { source: string }; thumbnail?: { source: string } } = await res.json()
  const full = d.originalimage?.source ?? d.thumbnail?.source ?? null
  const small = d.thumbnail?.source ?? d.originalimage?.source ?? null
  if (full && isPhoto(full)) return { src: full, thumb: small ?? full }
  return null
}

async function fetchImage(city: string, country: string): Promise<DestinationImage | null> {
  try {
    return (await fetchFromSearch(city, country)) ?? (await fetchFromSummary(city))
  } catch {
    return null // no image is fine — the card falls back to a gradient
  }
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

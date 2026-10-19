'use client'

import { useEffect, useState } from 'react'
import { wikiFetch } from './wikimedia'

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

// Titles that are clearly NOT a scenic photo of the place.
const JUNK = /locator|location.?map|\bmap\b|licen[sc]e.?plate|number.?plate|\bplate\b|satellite|copernicus|sentinel|landsat|aerial.?view.?map|diagram|\bflag\b|coat.?of.?arms|\bseal\b|\blogo\b|emblem|engraving|lithograph|\bdrawing\b|\bicon\b|stamp|banknote|\b1[5-8]\d\d\b/i
// Titles that suggest a recognisable view of the city/country.
const SCENIC = /\b(view|views|skyline|cityscape|panorama|panoramic|aerial|old.?town|historic|downtown|sunset|sunrise|night|harbou?r|waterfront|plaza|square|street|centre|center|cathedral|temple|castle|bridge|old.?city|seen.?from|from.?above)\b/i
// Subjects that are technically "in" the place but read as weird destination
// heroes: people (incl. occupation shots like "Lamp maker"/"Rug seller"),
// interiors, food, vehicles, signage. We reject these outright so a portrait or
// a hotel lobby can never win when nothing scenic ranks high.
const NON_SCENIC = /\b(?:portraits?|selfies?|close.?ups?|interiors?|indoors?|lobby|lounge|hotels?|hostels?|bedrooms?|bed|guest.?room|restaurants?|caf[eé]s?|food|dishes?|meals?|man|woman|girl|boy|child(?:ren)?|face|makers?|sellers?|merchants?|traders?|workers?|artisans?|craftsm[ae]n|weavers?|potters?|tanners?|fishermen|farmers?|musicians?|dancers?|performers?|car|bus|tram|train|plane|aircraft|airport|number.?plate|signboard|vendors?)\b/i

/** True when `title` clearly depicts a non-scenic subject (person, interior, food, vehicle…). */
export function isNonScenic(title: string): boolean {
  return NON_SCENIC.test(title)
}

/**
 * Does `text` actually reference the place `term`? Handles multi-word names
 * ("Hoi An"), compacted spellings ("Georgetown" vs "George Town"), and avoids
 * false hits from a short name embedded in a larger word ("Nice" in "Venice").
 * This is the relevance guard that stops same-named places from colliding.
 */
// Lower-case and strip accents so "Kyōto" / "São Paulo" match "Kyoto" / "Sao Paulo".
function fold(s: string): string {
  return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()
}

export function referencesPlace(text: string, term: string): boolean {
  const t = ` ${fold(text)} `
  const words = fold(term).split(/\s+/).filter(Boolean)
  if (words.length === 0) return false
  if (t.includes(` ${words.join(' ')} `)) return true // adjacent words: "hoi an"
  const compact = words.join('')
  if (compact.length >= 5 && t.replace(/ /g, '').includes(compact)) return true // "georgetown"
  return words.some((w) => w.length >= 4 && t.includes(` ${w} `)) // significant whole word
}

export interface CommonsCandidate {
  title: string
  mime?: string
  width?: number
  height?: number
  thumburl?: string
}

/**
 * Choose the best Commons photo for a destination. Keeps only landscape JPEG
 * photos whose title names the city (search hits that only mention it in the
 * description are often photos of somewhere else), drops junk (maps/flags/
 * plates) and non-scenic subjects, then ranks scenic views first. Returns null
 * when nothing qualifies, so the caller moves on to the Wikipedia article photo.
 */
export function selectCommons(candidates: CommonsCandidate[], city: string, country: string): string | null {
  const best = candidates
    .map((c, index) => ({ ...c, index }))
    .filter(
      (c) =>
        c.thumburl &&
        c.mime === 'image/jpeg' &&
        (c.width ?? 0) >= (c.height ?? 1) * 1.15 && // landscape
        isPhoto(c.title) &&
        !JUNK.test(c.title) &&
        !isNonScenic(c.title) &&
        referencesPlace(c.title, city),
    )
    .sort((a, b) => {
      const score = (t: string) => (SCENIC.test(t) ? 2 : 0) + (referencesPlace(t, country) ? 1 : 0)
      const d = score(b.title) - score(a.title)
      return d !== 0 ? d : a.index - b.index // then original search rank
    })[0]
  return best?.thumburl ?? null
}

export interface SummaryLike {
  type?: string
  title?: string
  description?: string
}

/**
 * Accept a Wikipedia page-summary result only if it's confidently the right
 * place: not a disambiguation page, and the destination's country is confirmed
 * in the title/description. This is what stops "Antigua" (Guatemala) resolving
 * to the Caribbean island's photo.
 */
export function acceptSummary(summary: SummaryLike, country: string): boolean {
  if (summary.type === 'disambiguation') return false
  return referencesPlace(`${summary.title ?? ''} ${summary.description ?? ''}`, country)
}

// Search Wikimedia Commons (the photo library) for a real, scenic landscape
// photo with the city in its file name, then apply the shared selection logic.
async function fetchFromCommons(city: string, country: string): Promise<DestinationImage | null> {
  const q = `intitle:"${city.replace(/"/g, '')}" ${country}`.trim()
  const url =
    `https://commons.wikimedia.org/w/api.php?action=query&format=json&origin=*` +
    `&generator=search&gsrsearch=${encodeURIComponent(q)}&gsrnamespace=6&gsrlimit=20` +
    `&prop=imageinfo&iiprop=url|mime|size&iiurlwidth=1080`
  const res = await wikiFetch(url)
  if (!res.ok) return null
  const data: {
    query?: {
      pages?: Record<string, {
        title?: string
        index?: number
        imageinfo?: Array<{ thumburl?: string; mime?: string; width?: number; height?: number }>
      }>
    }
  } = await res.json()
  const pages = data.query?.pages ? Object.values(data.query.pages) : []

  // Preserve the search rank so selectCommons' tiebreak matches relevance order.
  const candidates: CommonsCandidate[] = pages
    .sort((a, b) => (a.index ?? 99) - (b.index ?? 99))
    .map((p) => {
      const ii = p.imageinfo?.[0]
      return { title: p.title ?? '', mime: ii?.mime, width: ii?.width, height: ii?.height, thumburl: ii?.thumburl }
    })

  const best = selectCommons(candidates, city, country)
  return best ? { src: best, thumb: best } : null
}

// Search Wikipedia for "<city> <country>" and take that article's lead image —
// but only if the article we landed on actually references the place (guards
// against the top hit being a same-named but wrong article).
async function fetchFromSearch(city: string, country: string): Promise<DestinationImage | null> {
  const q = `${city} ${country}`.trim()
  const url =
    `https://en.wikipedia.org/w/api.php?action=query&format=json&origin=*` +
    `&generator=search&gsrsearch=${encodeURIComponent(q)}&gsrlimit=1` +
    `&prop=pageimages|info&piprop=original|thumbnail&pithumbsize=400`
  const res = await wikiFetch(url)
  if (!res.ok) return null
  const data: {
    query?: { pages?: Record<string, { title?: string; original?: { source: string }; thumbnail?: { source: string } }> }
  } = await res.json()
  const page = data.query?.pages ? Object.values(data.query.pages)[0] : undefined
  if (!page) return null

  const title = page.title ?? ''
  // Reject wrong-article and non-scenic lead images. The article has to be about
  // the city itself: a country-level hit would show somewhere else in the country.
  if (!referencesPlace(title, city) || isNonScenic(title)) return null

  const full = page.original?.source ?? page.thumbnail?.source ?? null
  const small = page.thumbnail?.source ?? page.original?.source ?? null
  if (full && isPhoto(full)) return { src: full, thumb: small ?? full }
  return null
}

// Last resort: the page summary for the city name — but only accept it when the
// country is confirmed, so an ambiguous name can't resolve to the wrong place.
async function fetchFromSummary(city: string, country: string): Promise<DestinationImage | null> {
  const res = await wikiFetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(city)}`)
  if (!res.ok) return null
  const d: SummaryLike & { originalimage?: { source: string }; thumbnail?: { source: string } } = await res.json()
  if (!acceptSummary(d, country)) return null
  const full = d.originalimage?.source ?? d.thumbnail?.source ?? null
  const small = d.thumbnail?.source ?? d.originalimage?.source ?? null
  if (full && isPhoto(full)) return { src: full, thumb: small ?? full }
  return null
}

async function fetchImage(city: string, country: string): Promise<DestinationImage | null> {
  try {
    // 1) Scenic Commons photo → 2) curated article lead image → 3) summary.
    return (
      (await fetchFromCommons(city, country)) ??
      (await fetchFromSearch(city, country)) ??
      (await fetchFromSummary(city, country))
    )
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

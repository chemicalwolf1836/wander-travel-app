import { NextResponse } from 'next/server'

export interface PhotoResult {
  url: string
  thumb: string
  alt: string
  credit: { name: string; link: string }
}

// In-memory cache (per server instance) so we don't burn Unsplash's
// dev rate limit (50 req/hr) re-fetching the same cities.
const cache = new Map<string, PhotoResult | null>()

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const city = searchParams.get('city')
  const country = searchParams.get('country') ?? ''

  if (!city) {
    return NextResponse.json({ error: 'Missing city param' }, { status: 400 })
  }

  const key = `${city}|${country}`.toLowerCase()
  if (cache.has(key)) {
    return NextResponse.json(cache.get(key), {
      headers: { 'Cache-Control': 'public, s-maxage=86400' },
    })
  }

  const accessKey = process.env.UNSPLASH_ACCESS_KEY
  if (!accessKey) {
    // No key configured — return null so the caller falls back to Wikipedia.
    return NextResponse.json(null)
  }

  const query = `${city} ${country} cityscape`.trim()
  const url =
    `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}` +
    `&orientation=landscape&per_page=1&content_filter=high`

  try {
    const res = await fetch(url, {
      headers: { Authorization: `Client-ID ${accessKey}` },
      next: { revalidate: 86400 }, // 24h upstream cache
    })
    if (!res.ok) {
      cache.set(key, null)
      return NextResponse.json(null)
    }

    const data: {
      results: Array<{
        urls: { regular: string; small: string }
        alt_description: string | null
        user: { name: string; links: { html: string } }
        links: { download_location: string }
      }>
    } = await res.json()

    const photo = data.results?.[0]
    if (!photo) {
      cache.set(key, null)
      return NextResponse.json(null)
    }

    // Unsplash API guideline: trigger the download endpoint when a photo is
    // used/displayed. Fire-and-forget; failure must not break the response.
    if (photo.links?.download_location) {
      fetch(photo.links.download_location, {
        headers: { Authorization: `Client-ID ${accessKey}` },
      }).catch(() => {})
    }

    const result: PhotoResult = {
      url: photo.urls.regular,
      thumb: photo.urls.small,
      alt: photo.alt_description ?? `${city}, ${country}`,
      credit: { name: photo.user.name, link: photo.user.links.html },
    }
    cache.set(key, result)
    return NextResponse.json(result, {
      headers: { 'Cache-Control': 'public, s-maxage=86400' },
    })
  } catch {
    cache.set(key, null)
    return NextResponse.json(null)
  }
}

'use client'

import { useEffect, useState } from 'react'
import type { WeatherData } from '@/types'

// Module-level caches so a destination's weather is fetched once per session
// and re-used instantly across Results, the detail panel, and the trip view.
const cache = new Map<string, WeatherData | null>()
const inflight = new Map<string, Promise<WeatherData | null>>()

function key(city: string, countryCode: string): string {
  return `${city}::${countryCode}`
}

/**
 * Fetch current weather for a destination, deduped and cached per session.
 * Returns null when weather is unavailable (no key / API failure) — the
 * `/api/weather` route already degrades gracefully to null.
 */
export function fetchWeather(city: string, countryCode: string): Promise<WeatherData | null> {
  const k = key(city, countryCode)
  if (cache.has(k)) return Promise.resolve(cache.get(k) ?? null)

  const existing = inflight.get(k)
  if (existing) return existing

  const promise = fetch(`/api/weather?city=${encodeURIComponent(city)}&country=${countryCode}`)
    .then((r) => r.json())
    .then((data: WeatherData | null) => {
      cache.set(k, data ?? null)
      inflight.delete(k)
      return data ?? null
    })
    .catch(() => {
      inflight.delete(k)
      return null
    })

  inflight.set(k, promise)
  return promise
}

/** React hook: current weather for one destination (null until loaded/unavailable). */
export function useWeather(city: string, countryCode: string): WeatherData | null {
  const [weather, setWeather] = useState<WeatherData | null>(() => cache.get(key(city, countryCode)) ?? null)

  useEffect(() => {
    let active = true
    fetchWeather(city, countryCode).then((data) => {
      if (active && data) setWeather(data)
    })
    return () => {
      active = false
    }
  }, [city, countryCode])

  return weather
}

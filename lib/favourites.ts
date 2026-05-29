import type { Destination } from '@/types'

const KEY = 'wander_favourites'

export function getFavourites(): Destination[] {
  if (typeof window === 'undefined') return []
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? '[]') as Destination[]
  } catch { return [] }
}

export function toggleFavourite(dest: Destination): boolean {
  const favs = getFavourites()
  const exists = favs.some(f => f.city === dest.city)
  const updated = exists ? favs.filter(f => f.city !== dest.city) : [...favs, dest]
  localStorage.setItem(KEY, JSON.stringify(updated))
  window.dispatchEvent(new CustomEvent('wander-favourites-changed', { detail: { count: updated.length } }))
  return !exists
}

export function isFavourite(city: string): boolean {
  return getFavourites().some(f => f.city === city)
}

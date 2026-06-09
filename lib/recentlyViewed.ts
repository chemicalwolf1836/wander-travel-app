import type { Destination } from '@/types'

const KEY = 'wander_recently_viewed'
const MAX = 8

export function getRecentlyViewed(): Destination[] {
  if (typeof window === 'undefined') return []
  try { return JSON.parse(localStorage.getItem(KEY) ?? '[]') as Destination[] } catch { return [] }
}

// Records a view, most-recent-first, de-duplicated by city and capped at MAX.
// Stores the full destination so it can be re-opened without another lookup.
export function recordView(dest: Destination) {
  if (typeof window === 'undefined') return
  const list = getRecentlyViewed().filter(d => d.city !== dest.city)
  list.unshift(dest)
  localStorage.setItem(KEY, JSON.stringify(list.slice(0, MAX)))
}

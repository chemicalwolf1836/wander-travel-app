import { notifyDataChanged } from '@/lib/syncEvents'

// A multi-city route built from saved places: ordered stops with days each.
export interface RouteStop { city: string; days: number }
export interface Route { stops: RouteStop[] }

const KEY = 'wander_route'
export const MIN_DAYS = 1
export const MAX_DAYS = 30

export function getRoute(): Route {
  if (typeof window === 'undefined') return { stops: [] }
  try {
    const r = JSON.parse(localStorage.getItem(KEY) ?? 'null') as Route | null
    return r && Array.isArray(r.stops) ? r : { stops: [] }
  } catch { return { stops: [] } }
}

export function saveRoute(route: Route) {
  localStorage.setItem(KEY, JSON.stringify(route))
  notifyDataChanged()
}

export function addStop(route: Route, city: string, days = 3): Route {
  if (route.stops.some(s => s.city === city)) return route
  return { stops: [...route.stops, { city, days }] }
}

export function removeStop(route: Route, city: string): Route {
  return { stops: route.stops.filter(s => s.city !== city) }
}

/** Move a stop up (-1) or down (+1); out-of-range moves are ignored. */
export function moveStop(route: Route, index: number, delta: -1 | 1): Route {
  const target = index + delta
  if (index < 0 || index >= route.stops.length || target < 0 || target >= route.stops.length) return route
  const stops = [...route.stops]
  ;[stops[index], stops[target]] = [stops[target], stops[index]]
  return { stops }
}

export function setDays(route: Route, city: string, days: number): Route {
  const clamped = Math.min(MAX_DAYS, Math.max(MIN_DAYS, Math.round(days)))
  return { stops: route.stops.map(s => (s.city === city ? { ...s, days: clamped } : s)) }
}

export function totalDays(route: Route): number {
  return route.stops.reduce((sum, s) => sum + s.days, 0)
}

/** Great-circle distance in km between two lat/lng points. */
export function distanceKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const R = 6371
  const toRad = (d: number) => (d * Math.PI) / 180
  const dLat = toRad(b.lat - a.lat)
  const dLng = toRad(b.lng - a.lng)
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(h))
}

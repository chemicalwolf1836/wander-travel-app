import type { Destination } from '@/types'

// localStorage keys that follow a signed-in user across devices.
export const SYNC_KEYS = [
  'wander_favourites',
  'wander_trip_notes',
  'wander_trip_dates',
  'wander_trip_plans',
  'wander_route',
  'wander_passport',
  'wander_home_city',
] as const

export type SyncKey = (typeof SYNC_KEYS)[number]
export type SyncData = Partial<Record<SyncKey, unknown>>

export function readLocal(): SyncData {
  const out: SyncData = {}
  for (const key of SYNC_KEYS) {
    const raw = localStorage.getItem(key)
    if (raw === null) continue
    try { out[key] = JSON.parse(raw) } catch { /* skip corrupt entries */ }
  }
  return out
}

export function writeLocal(data: SyncData) {
  for (const key of SYNC_KEYS) {
    if (data[key] === undefined) localStorage.removeItem(key)
    else localStorage.setItem(key, JSON.stringify(data[key]))
  }
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return !!v && typeof v === 'object' && !Array.isArray(v)
}

function isEmpty(v: unknown): boolean {
  if (v === undefined || v === null || v === '') return true
  if (Array.isArray(v)) return v.length === 0
  if (isRecord(v)) {
    // A route counts as empty when it has no stops.
    if (Array.isArray(v.stops)) return v.stops.length === 0
    return Object.keys(v).length === 0
  }
  return false
}

/**
 * First-sign-in merge of this device's data with the account's, so nothing is
 * lost: saved places are unioned by city (this device's order first), per-city
 * maps are merged with this device winning a conflict, and anything else keeps
 * this device's value unless it's empty.
 */
export function mergeSyncData(local: SyncData, remote: SyncData): SyncData {
  const out: SyncData = {}
  for (const key of SYNC_KEYS) {
    const l = local[key]
    const r = remote[key]
    if (key === 'wander_favourites') {
      const la = Array.isArray(l) ? (l as Destination[]) : []
      const ra = Array.isArray(r) ? (r as Destination[]) : []
      const merged = [...la, ...ra.filter(d => !la.some(x => x.city === d.city))]
      if (merged.length) out[key] = merged
    } else if (key === 'wander_trip_notes' || key === 'wander_trip_dates' || key === 'wander_trip_plans') {
      const merged = { ...(isRecord(r) ? r : {}), ...(isRecord(l) ? l : {}) }
      if (Object.keys(merged).length) out[key] = merged
    } else if (!isEmpty(l)) {
      out[key] = l
    } else if (!isEmpty(r)) {
      out[key] = r
    }
  }
  return out
}

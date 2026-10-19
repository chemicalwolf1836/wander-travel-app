import type { Preferences } from '@/types'

export const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
] as const

const KEY = 'wander_month'

export function getTravelMonth(): string {
  if (typeof window === 'undefined') return ''
  try { return sessionStorage.getItem(KEY) ?? '' } catch { return '' }
}

export function setTravelMonth(month: string) {
  try {
    if (month) sessionStorage.setItem(KEY, month)
    else sessionStorage.removeItem(KEY)
  } catch { /* ignore */ }
}

/** Fold the chosen travel month into the preferences sent to /api/suggest. */
export function withMonth(prefs: Preferences, month: string): Preferences {
  if (!month) return prefs
  return {
    ...prefs,
    summary: `${prefs.summary}, travelling in ${month}`,
    other: prefs.other ? `${prefs.other}; travel month: ${month}` : `travel month: ${month}`,
  }
}

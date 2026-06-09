const KEY = 'wander_trip_dates'

type DateMap = Record<string, string> // city -> ISO date (yyyy-mm-dd)

function load(): DateMap {
  if (typeof window === 'undefined') return {}
  try { return JSON.parse(localStorage.getItem(KEY) ?? '{}') as DateMap } catch { return {} }
}

export function getTripDate(city: string): string {
  return load()[city] ?? ''
}

export function saveTripDate(city: string, date: string) {
  const dates = load()
  if (date) dates[city] = date
  else delete dates[city]
  localStorage.setItem(KEY, JSON.stringify(dates))
}

/** Whole days from today until the given ISO date. Negative if in the past, null if unset/invalid. */
export function daysUntil(dateISO: string, now: Date = new Date()): number | null {
  if (!dateISO) return null
  const target = new Date(`${dateISO}T00:00:00`)
  if (Number.isNaN(target.getTime())) return null
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const msPerDay = 24 * 60 * 60 * 1000
  return Math.round((target.getTime() - startOfToday.getTime()) / msPerDay)
}

/** Human-friendly countdown, e.g. "In 42 days", "Tomorrow", "Today", "Trip passed". */
export function countdownLabel(dateISO: string, now: Date = new Date()): string {
  const d = daysUntil(dateISO, now)
  if (d === null) return ''
  if (d < 0) return 'Trip passed'
  if (d === 0) return 'Today'
  if (d === 1) return 'Tomorrow'
  return `In ${d} days`
}

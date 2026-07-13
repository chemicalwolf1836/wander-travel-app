// Persists the AI-generated trip content (itinerary + packing list) a user has
// looked at, per city, in localStorage — mirroring lib/tripNotes.ts and
// lib/tripDates.ts. Today those lists are regenerated on every modal open and
// thrown away; storing them lets the /trip/[city] view assemble a full plan and
// lets the modals reopen instantly without another AI call.

export type PackingCategory = { name: string; items: string[] }
export type ItineraryDay = {
  day: number
  title: string
  morning: string
  afternoon: string
  evening: string
  tip: string
}

export interface TripPlan {
  itinerary?: { days: ItineraryDay[]; tripDays: number }
  packing?: { categories: PackingCategory[]; tripDays: number }
}

const KEY = 'wander_trip_plans'

type PlanMap = Record<string, TripPlan>

function load(): PlanMap {
  if (typeof window === 'undefined') return {}
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? '{}') as PlanMap
  } catch {
    return {}
  }
}

function save(plans: PlanMap) {
  if (typeof window === 'undefined') return
  localStorage.setItem(KEY, JSON.stringify(plans))
}

/** The stored plan for a city, or an empty object if nothing has been generated. */
export function getTripPlan(city: string): TripPlan {
  return load()[city] ?? {}
}

/** True when a city has any saved trip content (used to show/hide the trip entry point). */
export function hasTripPlan(city: string): boolean {
  const plan = load()[city]
  return !!plan && (!!plan.itinerary || !!plan.packing)
}

/** Merge a freshly generated itinerary into the city's plan, preserving any saved packing list. */
export function saveItinerary(city: string, days: ItineraryDay[], tripDays: number) {
  const plans = load()
  plans[city] = { ...plans[city], itinerary: { days, tripDays } }
  save(plans)
}

/** Merge a freshly generated packing list into the city's plan, preserving any saved itinerary. */
export function savePacking(city: string, categories: PackingCategory[], tripDays: number) {
  const plans = load()
  plans[city] = { ...plans[city], packing: { categories, tripDays } }
  save(plans)
}

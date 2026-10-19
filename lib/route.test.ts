import { describe, it, expect } from 'vitest'
import { addStop, removeStop, moveStop, setDays, totalDays, distanceKm, MAX_DAYS } from './route'

const base = { stops: [{ city: 'Lisbon', days: 3 }, { city: 'Porto', days: 2 }] }

describe('route helpers', () => {
  it('adds a stop once', () => {
    const r = addStop(base, 'Seville')
    expect(r.stops.map(s => s.city)).toEqual(['Lisbon', 'Porto', 'Seville'])
    expect(addStop(r, 'Seville')).toBe(r)
  })
  it('removes and reorders stops', () => {
    expect(removeStop(base, 'Lisbon').stops).toEqual([{ city: 'Porto', days: 2 }])
    expect(moveStop(base, 1, -1).stops.map(s => s.city)).toEqual(['Porto', 'Lisbon'])
    expect(moveStop(base, 0, -1)).toBe(base)
  })
  it('clamps days and totals them', () => {
    expect(setDays(base, 'Porto', 99).stops[1].days).toBe(MAX_DAYS)
    expect(setDays(base, 'Porto', 0).stops[1].days).toBe(1)
    expect(totalDays(base)).toBe(5)
  })
  it('measures great-circle distance', () => {
    // Lisbon → Porto is roughly 275 km as the crow flies
    const km = distanceKm({ lat: 38.72, lng: -9.14 }, { lat: 41.15, lng: -8.61 })
    expect(km).toBeGreaterThan(260)
    expect(km).toBeLessThan(290)
  })
})

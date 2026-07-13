import { describe, it, expect, beforeEach } from 'vitest'
import { getTripPlan, hasTripPlan, saveItinerary, savePacking } from './tripPlan'

const DAYS = [
  { day: 1, title: 'Arrival', morning: 'a', afternoon: 'b', evening: 'c', tip: 't' },
]
const CATS = [{ name: 'Clothing', items: ['socks', 'jacket'] }]

describe('tripPlan', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('returns an empty plan for an unknown city', () => {
    expect(getTripPlan('Tokyo')).toEqual({})
    expect(hasTripPlan('Tokyo')).toBe(false)
  })

  it('saves and retrieves an itinerary per city', () => {
    saveItinerary('Tokyo', DAYS, 3)
    expect(getTripPlan('Tokyo').itinerary).toEqual({ days: DAYS, tripDays: 3 })
    expect(hasTripPlan('Tokyo')).toBe(true)
    expect(getTripPlan('Lisbon')).toEqual({})
  })

  it('merges packing and itinerary without clobbering each other', () => {
    saveItinerary('Tokyo', DAYS, 3)
    savePacking('Tokyo', CATS, 5)
    const plan = getTripPlan('Tokyo')
    expect(plan.itinerary).toEqual({ days: DAYS, tripDays: 3 })
    expect(plan.packing).toEqual({ categories: CATS, tripDays: 5 })
  })

  it('overwrites the same section on re-save', () => {
    saveItinerary('Tokyo', DAYS, 3)
    const newDays = [...DAYS, { day: 2, title: 'Day 2', morning: 'm', afternoon: 'a', evening: 'e', tip: '' }]
    saveItinerary('Tokyo', newDays, 7)
    expect(getTripPlan('Tokyo').itinerary).toEqual({ days: newDays, tripDays: 7 })
  })

  it('recovers from corrupt localStorage JSON', () => {
    localStorage.setItem('wander_trip_plans', '{not valid json')
    expect(getTripPlan('Tokyo')).toEqual({})
    // and a subsequent save still works
    savePacking('Tokyo', CATS, 5)
    expect(getTripPlan('Tokyo').packing).toEqual({ categories: CATS, tripDays: 5 })
  })
})

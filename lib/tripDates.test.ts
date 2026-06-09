import { describe, it, expect, beforeEach } from 'vitest'
import { getTripDate, saveTripDate, daysUntil, countdownLabel } from './tripDates'

const NOW = new Date('2026-06-10T12:00:00')

describe('tripDates storage', () => {
  beforeEach(() => localStorage.clear())

  it('saves and retrieves a date per city', () => {
    saveTripDate('Tokyo', '2026-07-01')
    expect(getTripDate('Tokyo')).toBe('2026-07-01')
    expect(getTripDate('Lisbon')).toBe('')
  })

  it('clears a date when saved empty', () => {
    saveTripDate('Tokyo', '2026-07-01')
    saveTripDate('Tokyo', '')
    expect(getTripDate('Tokyo')).toBe('')
  })
})

describe('daysUntil', () => {
  it('returns null for unset or invalid input', () => {
    expect(daysUntil('', NOW)).toBeNull()
    expect(daysUntil('not-a-date', NOW)).toBeNull()
  })

  it('counts whole days ignoring the time of day', () => {
    expect(daysUntil('2026-06-10', NOW)).toBe(0)
    expect(daysUntil('2026-06-11', NOW)).toBe(1)
    expect(daysUntil('2026-07-22', NOW)).toBe(42)
    expect(daysUntil('2026-06-09', NOW)).toBe(-1)
  })
})

describe('countdownLabel', () => {
  it('formats relative labels', () => {
    expect(countdownLabel('', NOW)).toBe('')
    expect(countdownLabel('2026-06-10', NOW)).toBe('Today')
    expect(countdownLabel('2026-06-11', NOW)).toBe('Tomorrow')
    expect(countdownLabel('2026-07-22', NOW)).toBe('In 42 days')
    expect(countdownLabel('2026-06-01', NOW)).toBe('Trip passed')
  })
})

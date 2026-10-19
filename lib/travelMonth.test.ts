import { describe, it, expect } from 'vitest'
import { withMonth } from './travelMonth'

const prefs = { summary: 'Beaches', climate: 'hot', budget: 'mid', travelStyle: 'relaxed', foodPreferences: '', other: '' }

describe('withMonth', () => {
  it('leaves preferences alone when no month is chosen', () => {
    expect(withMonth(prefs, '')).toBe(prefs)
  })
  it('adds the month to the summary (and so the cache key) and to other', () => {
    const out = withMonth({ ...prefs, other: 'Asia' }, 'March')
    expect(out.summary).toBe('Beaches, travelling in March')
    expect(out.other).toBe('Asia; travel month: March')
  })
})

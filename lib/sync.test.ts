import { describe, it, expect } from 'vitest'
import { mergeSyncData } from './sync'
import type { Destination } from '@/types'

const d = (city: string) => ({ city } as Destination)

describe('mergeSyncData', () => {
  it('unions saved places by city, this device first', () => {
    const out = mergeSyncData(
      { wander_favourites: [d('Kyoto'), d('Lisbon')] },
      { wander_favourites: [d('Lisbon'), d('Oaxaca')] },
    )
    expect((out.wander_favourites as Destination[]).map(x => x.city)).toEqual(['Kyoto', 'Lisbon', 'Oaxaca'])
  })

  it('merges per-city maps with this device winning conflicts', () => {
    const out = mergeSyncData(
      { wander_trip_notes: { Kyoto: 'local' } },
      { wander_trip_notes: { Kyoto: 'remote', Lisbon: 'remote' } },
    )
    expect(out.wander_trip_notes).toEqual({ Kyoto: 'local', Lisbon: 'remote' })
  })

  it('takes the account value when this device has none', () => {
    const out = mergeSyncData(
      { wander_route: { stops: [] } },
      { wander_route: { stops: [{ city: 'Kyoto', days: 3 }] }, wander_passport: 'MN' },
    )
    expect(out.wander_route).toEqual({ stops: [{ city: 'Kyoto', days: 3 }] })
    expect(out.wander_passport).toBe('MN')
  })

  it('leaves out keys that are empty on both sides', () => {
    expect(mergeSyncData({}, {})).toEqual({})
  })
})

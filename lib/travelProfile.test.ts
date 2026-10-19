import { describe, it, expect } from 'vitest'
import { bookingLinks } from './travelProfile'

describe('bookingLinks', () => {
  it('builds encoded search links with and without a home city', () => {
    const withHome = bookingLinks('Cape Town', 'South Africa', 'Ulaanbaatar')
    expect(withHome.map(l => l.label)).toEqual(['Flights', 'Hotels', 'Homes'])
    expect(withHome[0].href).toContain(encodeURIComponent('Flights from Ulaanbaatar to Cape Town'))
    expect(withHome[1].href).toContain(encodeURIComponent('Cape Town, South Africa'))
    expect(bookingLinks('Kyoto', 'Japan', '')[0].href).toContain(encodeURIComponent('Flights to Kyoto'))
  })
})

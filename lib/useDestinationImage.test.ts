import { describe, it, expect } from 'vitest'
import { referencesPlace, isNonScenic, selectCommons, acceptSummary } from './useDestinationImage'

describe('referencesPlace', () => {
  it('matches a multi-word city as adjacent words', () => {
    expect(referencesPlace('Street Scene - Hoi An - Vietnam', 'Hoi An')).toBe(true)
  })
  it('matches a compacted spelling (Georgetown vs George Town)', () => {
    expect(referencesPlace('Skyline of George Town, Penang', 'Georgetown')).toBe(true)
  })
  it('matches a single significant token as a whole word', () => {
    expect(referencesPlace('Promenade des Anglais Nice', 'Nice')).toBe(true)
  })
  it('does NOT match a short name embedded in another word (Nice in Venice)', () => {
    expect(referencesPlace('Grand Canal of Venice, Italy', 'Nice')).toBe(false)
  })
  it('ignores accents (Kyōto, São Paulo)', () => {
    expect(referencesPlace('Kyōto Gion district at night', 'Kyoto')).toBe(true)
    expect(referencesPlace('Avenida Paulista, São Paulo', 'Sao Paulo')).toBe(true)
  })
  it('returns false when the place is absent', () => {
    expect(referencesPlace('Island in Antigua and Barbuda', 'Guatemala')).toBe(false)
  })
})

describe('isNonScenic', () => {
  it('flags people/occupations/interiors/food/vehicles', () => {
    expect(isNonScenic('Lamp maker, Medina of Marrakech')).toBe(true) // occupation -> a person, not a view
    expect(isNonScenic('Rug seller in the souk')).toBe(true)
    expect(isNonScenic('Lobby lounge of Amantaka luxury Resort Hotel')).toBe(true)
    expect(isNonScenic('Traditional food dish of the region')).toBe(true)
    expect(isNonScenic('Portrait of a local woman')).toBe(true)
  })
  it('does not flag genuine cityscapes', () => {
    expect(isNonScenic('Panorama of the old town at sunset')).toBe(false)
    expect(isNonScenic('View of Chefchaouen')).toBe(false)
  })
})

describe('selectCommons', () => {
  const land = (title: string) => ({ title, mime: 'image/jpeg', width: 1600, height: 1000, thumburl: `https://x/${encodeURIComponent(title)}` })

  it('prefers a scenic, city-referencing photo over a non-scenic one', () => {
    const chosen = selectCommons([
      land('Lobby of the Grand Hotel, Kyoto'),   // non-scenic -> dropped
      land('Kyoto skyline at dusk'),             // scenic + references city -> win
      land('Random building'),                   // neither
    ], 'Kyoto', 'Japan')
    expect(chosen).toContain('Kyoto%20skyline%20at%20dusk')
  })

  it('drops portrait-orientation and non-jpeg candidates', () => {
    const chosen = selectCommons([
      { title: 'Kyoto tower portrait', mime: 'image/jpeg', width: 800, height: 1200, thumburl: 'https://x/portrait' }, // portrait
      { title: 'Kyoto map', mime: 'image/png', width: 1600, height: 1000, thumburl: 'https://x/png' }, // not jpeg + junk
      land('Kyoto riverside view'),
    ], 'Kyoto', 'Japan')
    expect(chosen).toContain('Kyoto%20riverside%20view')
  })

  it('drops photos whose title does not name the city, however scenic', () => {
    const chosen = selectCommons([
      land('Mount Fuji panorama at sunset, Japan'), // scenic, right country, wrong place
      land('Fushimi Inari, Kyoto'),
    ], 'Kyoto', 'Japan')
    expect(chosen).toContain('Fushimi%20Inari%2C%20Kyoto')
    expect(selectCommons([land('Mount Fuji panorama at sunset, Japan')], 'Kyoto', 'Japan')).toBeNull()
  })

  it('returns null when everything is non-scenic or junk', () => {
    const chosen = selectCommons([
      land('Hotel lobby interior'),
      land('Coat of arms of the city'),
    ], 'Kyoto', 'Japan')
    expect(chosen).toBeNull()
  })
})

describe('acceptSummary', () => {
  it('rejects disambiguation pages', () => {
    expect(acceptSummary({ type: 'disambiguation', title: 'Victoria', description: 'Topics referred to by the same term' }, 'Seychelles')).toBe(false)
  })
  it('rejects a same-named place in the wrong country (Antigua island vs Guatemala)', () => {
    expect(acceptSummary({ type: 'standard', title: 'Antigua', description: 'Island in Antigua and Barbuda' }, 'Guatemala')).toBe(false)
  })
  it('accepts when the country is confirmed in the summary', () => {
    expect(acceptSummary({ type: 'standard', title: 'Salta', description: 'City in Salta Province, Argentina' }, 'Argentina')).toBe(true)
  })
})

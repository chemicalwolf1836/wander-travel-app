import { describe, expect, it } from 'vitest'
import { cleanItemEmoji, emojiFor, itemEmoji, weatherEmoji } from './itemEmoji'

describe('emojiFor', () => {
  it('matches places by the words in their names', () => {
    expect(emojiFor('Belém Tower', 'see')).toBe('🏰')
    expect(emojiFor('Jerónimos Monastery', 'see')).toBe('⛪')
    expect(emojiFor('Alfama', 'see')).toBe('🏘️')
    expect(emojiFor('Sintra day trip', 'see')).toBe('🏞️')
    expect(emojiFor('Fushimi Inari Shrine', 'see')).toBe('🛕')
    expect(emojiFor('Mercado Benito Juárez', 'see')).toBe('🛍️')
  })

  it('matches dishes', () => {
    expect(emojiFor('Pastel de nata', 'eat')).toBe('🥐')
    expect(emojiFor('Bacalhau à Brás', 'eat')).toBe('🐟')
    expect(emojiFor('Bifana', 'eat')).toBe('🥪')
    expect(emojiFor('Tonkotsu ramen', 'eat')).toBe('🍜')
    expect(emojiFor('Mole negro', 'eat')).toBe('🌶️')
  })

  it('matches travel vibes', () => {
    expect(emojiFor('Food', 'vibe')).toBe('🍽️')
    expect(emojiFor('Old towns', 'vibe')).toBe('🏛️')
    expect(emojiFor('Coast', 'vibe')).toBe('🌊')
    expect(emojiFor('Nightlife', 'vibe')).toBe('🌙')
  })

  it('falls back to a neutral emoji for each kind', () => {
    expect(emojiFor('Zzyzx', 'see')).toBe('📍')
    expect(emojiFor('Zzyzx', 'eat')).toBe('🍽️')
    expect(emojiFor('Zzyzx', 'vibe')).toBe('✨')
  })
})

describe('weatherEmoji', () => {
  it('maps conditions and falls back to a thermometer', () => {
    expect(weatherEmoji('Clear')).toBe('☀️')
    expect(weatherEmoji('Rain')).toBe('🌧️')
    expect(weatherEmoji('Tornado')).toBe('🌡️')
    expect(weatherEmoji(undefined)).toBe('🌡️')
  })
})

describe('itemEmoji', () => {
  it('prefers the emoji the AI picked, then falls back to the name', () => {
    const dest = { itemEmoji: { 'Hagia Sophia': '🕌' } }
    expect(itemEmoji(dest, 'Hagia Sophia', 'see')).toBe('🕌')
    expect(itemEmoji(dest, 'Galata Tower', 'see')).toBe('🏰')
    expect(itemEmoji({}, 'Hagia Sophia', 'see')).toBe('📍')
  })
})

describe('cleanItemEmoji', () => {
  const base = {
    city: 'Lisbon', country: 'Portugal', countryCode: 'PT', region: 'Europe', flagEmoji: '🇵🇹',
    tagline: '', description: '', coordinates: { lat: 0, lng: 0 },
    food: { summary: '', dishes: ['Bifana'] }, attractions: ['Alfama'], bestFor: ['Coast'], emoji: '🌊',
    culturalTheme: { primary: '#000', accent: '#c2410c', background: '#000', cardBg: '#111', text: '#fff', mood: '' },
  }

  it('keeps single emoji for listed items and drops the rest', () => {
    const out = cleanItemEmoji({
      ...base,
      itemEmoji: { Alfama: '🏘️', Bifana: '🥪', Coast: 'wave', 'Made up': '🏰', 'Coast ': '🌊' } as Record<string, string>,
    })
    expect(out.itemEmoji).toEqual({ Alfama: '🏘️', Bifana: '🥪' })
  })

  it('accepts flags, skin tones and joined emoji, but not two emoji', () => {
    const out = cleanItemEmoji({ ...base, itemEmoji: { Alfama: '🇵🇹', Bifana: '👨‍🍳', Coast: '🌊🌊' } })
    expect(out.itemEmoji).toEqual({ Alfama: '🇵🇹', Bifana: '👨‍🍳' })
  })

  it('removes a missing or malformed field', () => {
    expect('itemEmoji' in cleanItemEmoji({ ...base, itemEmoji: 'nope' as unknown as Record<string, string> })).toBe(false)
    expect('itemEmoji' in cleanItemEmoji(base)).toBe(false)
  })
})

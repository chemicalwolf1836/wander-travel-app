import { describe, expect, it } from 'vitest'
import { emojiFor, weatherEmoji } from './itemEmoji'

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

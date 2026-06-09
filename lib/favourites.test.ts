import { describe, it, expect, beforeEach } from 'vitest'
import { getFavourites, toggleFavourite, isFavourite } from './favourites'
import type { Destination } from '@/types'

// Minimal Destination stub — only the fields these functions read (city) matter.
function dest(city: string): Destination {
  return { city } as Destination
}

describe('favourites', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('starts empty', () => {
    expect(getFavourites()).toEqual([])
    expect(isFavourite('Tokyo')).toBe(false)
  })

  it('toggles a destination on and off', () => {
    expect(toggleFavourite(dest('Tokyo'))).toBe(true)
    expect(isFavourite('Tokyo')).toBe(true)
    expect(getFavourites()).toHaveLength(1)

    expect(toggleFavourite(dest('Tokyo'))).toBe(false)
    expect(isFavourite('Tokyo')).toBe(false)
    expect(getFavourites()).toHaveLength(0)
  })

  it('keeps multiple distinct destinations', () => {
    toggleFavourite(dest('Tokyo'))
    toggleFavourite(dest('Lisbon'))
    expect(getFavourites().map(d => d.city).sort()).toEqual(['Lisbon', 'Tokyo'])
  })

  it('returns [] when stored data is corrupt', () => {
    localStorage.setItem('wander_favourites', 'not json')
    expect(getFavourites()).toEqual([])
  })
})

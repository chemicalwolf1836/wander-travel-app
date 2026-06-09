import { describe, it, expect, beforeEach } from 'vitest'
import { getNote, saveNote } from './tripNotes'

describe('tripNotes', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('returns an empty string for an unknown city', () => {
    expect(getNote('Tokyo')).toBe('')
  })

  it('saves and retrieves a note per city', () => {
    saveNote('Tokyo', 'Visit in spring for the blossoms')
    expect(getNote('Tokyo')).toBe('Visit in spring for the blossoms')
    expect(getNote('Lisbon')).toBe('')
  })

  it('deletes a note when saved with empty/whitespace text', () => {
    saveNote('Tokyo', 'something')
    saveNote('Tokyo', '   ')
    expect(getNote('Tokyo')).toBe('')
  })
})

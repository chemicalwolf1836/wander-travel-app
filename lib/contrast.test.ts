import { describe, it, expect } from 'vitest'
import { contrastRatio, readableOn, textOn, parseHex } from './contrast'

describe('contrastRatio', () => {
  it('matches the WCAG extremes', () => {
    expect(contrastRatio('#000000', '#ffffff')).toBeCloseTo(21, 0)
    expect(contrastRatio('#777777', '#777777')).toBeCloseTo(1, 5)
  })
  it('parses short hex', () => {
    expect(parseHex('#fff')).toEqual([255, 255, 255])
    expect(parseHex('red')).toBeNull()
  })
})

describe('readableOn', () => {
  it('keeps an accent that already passes', () => {
    expect(readableOn('#f59e0b', '#000000')).toBe('#f59e0b')
  })
  it('lightens a dark accent on a dark photo scrim', () => {
    const out = readableOn('#8b0000', '#000000')
    expect(out).not.toBe('#8b0000')
    expect(contrastRatio(out, '#000000')).toBeGreaterThanOrEqual(4.5)
  })
  it('darkens a pale accent on a white card', () => {
    const out = readableOn('#f59e0b', '#ffffff')
    expect(contrastRatio(out, '#ffffff')).toBeGreaterThanOrEqual(4.5)
  })
  it('falls back to plain text for an unparseable accent', () => {
    expect(readableOn('tomato', '#000000')).toBe('#ffffff')
  })
})

describe('textOn', () => {
  it('picks dark text on a bright accent and white on a deep one', () => {
    expect(textOn('#f59e0b')).toBe('#0a0f1e')
    expect(textOn('#7c2d12')).toBe('#ffffff')
  })
})

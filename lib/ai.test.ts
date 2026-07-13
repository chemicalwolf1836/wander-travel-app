import { describe, it, expect } from 'vitest'
import { stripFences, extractText, parseClaudeJson, ClaudeJsonError } from './ai'

describe('stripFences', () => {
  it('strips ```json fences', () => {
    expect(stripFences('```json\n[1,2]\n```')).toBe('[1,2]')
  })
  it('strips bare ``` fences', () => {
    expect(stripFences('```\n{"a":1}\n```')).toBe('{"a":1}')
  })
  it('leaves unfenced text untouched (trimmed)', () => {
    expect(stripFences('  [1,2]  ')).toBe('[1,2]')
  })
})

describe('extractText', () => {
  it('returns the first text block, trimmed', () => {
    expect(extractText({ content: [{ type: 'text', text: '  hi  ' }] })).toBe('hi')
  })
  it('returns empty string when the first block is not text', () => {
    expect(extractText({ content: [{ type: 'tool_use' }] })).toBe('')
  })
  it('returns empty string when there is no content', () => {
    expect(extractText({ content: [] })).toBe('')
  })
})

describe('parseClaudeJson', () => {
  it('parses a fenced JSON array', () => {
    expect(parseClaudeJson('```json\n[{"a":1}]\n```', { expectArray: true })).toEqual([{ a: 1 }])
  })
  it('parses an object when no array is expected', () => {
    expect(parseClaudeJson('{"currency":"USD"}')).toEqual({ currency: 'USD' })
  })
  it('throws a parse error on invalid JSON', () => {
    expect(() => parseClaudeJson('not json')).toThrowError(ClaudeJsonError)
    try {
      parseClaudeJson('not json')
    } catch (e) {
      expect((e as ClaudeJsonError).reason).toBe('parse')
    }
  })
  it('throws a shape error when an array is expected but an object is returned', () => {
    try {
      parseClaudeJson('{"a":1}', { expectArray: true })
      throw new Error('should have thrown')
    } catch (e) {
      expect(e).toBeInstanceOf(ClaudeJsonError)
      expect((e as ClaudeJsonError).reason).toBe('shape')
    }
  })
  it('throws a shape error on an empty array', () => {
    try {
      parseClaudeJson('[]', { expectArray: true })
      throw new Error('should have thrown')
    } catch (e) {
      expect((e as ClaudeJsonError).reason).toBe('shape')
    }
  })
})

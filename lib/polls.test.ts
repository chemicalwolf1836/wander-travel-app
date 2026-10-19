import { describe, it, expect } from 'vitest'
import { tally, cleanChoices, newPollId, type PollOption } from './polls'

const opt = (city: string) => ({ city, country: '', countryCode: '', flagEmoji: '', tagline: '' } as PollOption)
const options = [opt('Kyoto'), opt('Lisbon'), opt('Oaxaca')]

describe('polls', () => {
  it('tallies approval votes and finds a single leader', () => {
    const { counts, leader } = tally(options, [
      { choices: ['Kyoto', 'Lisbon'] },
      { choices: ['Lisbon'] },
    ])
    expect(counts).toEqual([{ city: 'Kyoto', count: 1 }, { city: 'Lisbon', count: 2 }, { city: 'Oaxaca', count: 0 }])
    expect(leader).toBe('Lisbon')
  })
  it('reports no leader on a tie or with no votes', () => {
    expect(tally(options, [{ choices: ['Kyoto'] }, { choices: ['Oaxaca'] }]).leader).toBeNull()
    expect(tally(options, []).leader).toBeNull()
  })
  it('drops unknown and duplicate choices', () => {
    expect(cleanChoices(options, ['Kyoto', 'Paris', 'Kyoto'])).toEqual(['Kyoto'])
  })
  it('makes url-safe ids', () => {
    expect(newPollId()).toMatch(/^[a-z2-9]{12}$/)
  })
})

// Shared shapes and pure helpers for group voting (used by routes and pages).

export interface PollOption {
  city: string
  country: string
  countryCode: string
  flagEmoji: string
  tagline: string
}

export interface PollVote { voterId: string; name: string; choices: string[] }

export interface Poll {
  id: string
  title: string
  options: PollOption[]
  votes: { name: string; choices: string[] }[]
}

export const MAX_OPTIONS = 12

/** Votes per city, in option order, plus the leading city (null on a tie or no votes). */
export function tally(options: PollOption[], votes: { choices: string[] }[]) {
  const counts = options.map(o => ({
    city: o.city,
    count: votes.filter(v => v.choices.includes(o.city)).length,
  }))
  const top = Math.max(0, ...counts.map(c => c.count))
  const leaders = counts.filter(c => c.count === top && top > 0)
  return { counts, leader: leaders.length === 1 ? leaders[0].city : null }
}

/** Keep only choices that are real options, without duplicates. */
export function cleanChoices(options: PollOption[], choices: string[]): string[] {
  const valid = new Set(options.map(o => o.city))
  return [...new Set(choices)].filter(c => valid.has(c))
}

/** URL-safe random poll id (~60 bits). */
export function newPollId(): string {
  const alphabet = 'abcdefghijkmnpqrstuvwxyz23456789'
  const bytes = crypto.getRandomValues(new Uint8Array(12))
  return Array.from(bytes, b => alphabet[b % alphabet.length]).join('')
}

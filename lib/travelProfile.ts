import { notifyDataChanged } from '@/lib/syncEvents'

// Small per-traveller settings used by the price and visa tools. Synced with
// the account (see SYNC_KEYS in lib/sync.ts).
const HOME_KEY = 'wander_home_city'
const PASSPORT_KEY = 'wander_passport'

function read(key: string): string {
  if (typeof window === 'undefined') return ''
  try { return (JSON.parse(localStorage.getItem(key) ?? '""') as string) || '' } catch { return '' }
}

function write(key: string, value: string) {
  if (value) localStorage.setItem(key, JSON.stringify(value))
  else localStorage.removeItem(key)
  notifyDataChanged()
}

export const getHomeCity = () => read(HOME_KEY)
export const saveHomeCity = (city: string) => write(HOME_KEY, city.trim())
/** ISO 3166-1 alpha-2 code of the traveller's passport, e.g. "MN". */
export const getPassport = () => read(PASSPORT_KEY)
export const savePassport = (code: string) => write(PASSPORT_KEY, code.toUpperCase())

/** Deep links to search flights, stays and hotels for a destination. */
export function bookingLinks(city: string, country: string, from: string) {
  const place = `${city}, ${country}`
  return [
    {
      label: 'Flights',
      site: 'Google Flights',
      href: `https://www.google.com/travel/flights?q=${encodeURIComponent(from ? `Flights from ${from} to ${city}` : `Flights to ${city}`)}`,
    },
    { label: 'Hotels', site: 'Booking.com', href: `https://www.booking.com/searchresults.html?ss=${encodeURIComponent(place)}` },
    { label: 'Homes', site: 'Airbnb', href: `https://www.airbnb.com/s/${encodeURIComponent(place)}/homes` },
  ]
}

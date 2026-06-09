import type { Metadata } from 'next'
import { DestinationView } from './DestinationView'

// The destination data lives in the visitor's sessionStorage (client-only), so the
// server only has the city name from the URL. That's still enough to give each
// destination its own title and share card instead of the generic site one.
export async function generateMetadata({ params }: { params: Promise<{ city: string }> }): Promise<Metadata> {
  const { city } = await params
  const name = decodeURIComponent(city)
  const title = `${name} · Wander`
  const description = `Discover ${name} with Wander — attractions, food, best seasons, and a day-by-day itinerary.`
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `/destination/${city}`,
      siteName: 'Wander',
      type: 'website',
      locale: 'en_GB',
    },
  }
}

export default function Page() {
  return <DestinationView />
}

import type { Metadata } from 'next'
import { DestinationView } from './DestinationView'
import { getSharedDestination } from '@/lib/sharedDestinationsServer'

// Destinations opened in Wander are stored server-side for sharing, so when we
// have one we use its tagline; otherwise the city name from the URL is enough
// for a per-destination title and share card.
export async function generateMetadata({ params }: { params: Promise<{ city: string }> }): Promise<Metadata> {
  const { city } = await params
  const name = decodeURIComponent(city)
  const shared = await getSharedDestination(name)
  const title = shared ? `${shared.city}, ${shared.country} · Wander` : `${name} · Wander`
  const description = shared?.tagline
    ?? `Discover ${name} with Wander — attractions, food, best seasons, and a day-by-day itinerary.`
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

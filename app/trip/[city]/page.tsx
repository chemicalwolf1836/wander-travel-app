import type { Metadata } from 'next'
import { TripView } from './TripView'

// Like /destination/[city], the trip data lives in the visitor's localStorage,
// so the server only knows the city name from the URL — enough for a good title.
export async function generateMetadata({ params }: { params: Promise<{ city: string }> }): Promise<Metadata> {
  const { city } = await params
  const name = decodeURIComponent(city)
  const title = `${name} trip · Wander`
  const description = `Your ${name} trip plan — dates, notes, itinerary, and packing list, all in one place.`
  return {
    title,
    description,
    openGraph: { title, description, url: `/trip/${city}`, siteName: 'Wander', type: 'website', locale: 'en_GB' },
  }
}

export default async function Page({ params }: { params: Promise<{ city: string }> }) {
  const { city } = await params
  return <TripView city={decodeURIComponent(city)} />
}

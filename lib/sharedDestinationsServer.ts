import { createServerClient } from '@/lib/supabase/server'
import { destinationSlug } from '@/lib/sharedDestinations'
import type { Destination } from '@/types'

/** Server-only: the stored destination for a city, or null (unknown, or DB unavailable). */
export async function getSharedDestination(city: string): Promise<Destination | null> {
  try {
    const supabase = createServerClient()
    const { data } = await supabase
      .from('shared_destinations')
      .select('data')
      .eq('slug', destinationSlug(city))
      .maybeSingle()
    return (data?.data as Destination | undefined) ?? null
  } catch {
    return null
  }
}

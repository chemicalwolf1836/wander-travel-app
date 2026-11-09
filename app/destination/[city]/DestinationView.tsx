'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter, useParams } from 'next/navigation'
import { AnimatePresence, motion } from 'framer-motion'
import { useTheme } from 'next-themes'
import { Navbar } from '@/components/Navbar'
import { MapTransport } from '@/components/MapTransport'
import { DetailPanel } from '@/components/DetailPanel'
import { applyTheme, resetTheme } from '@/lib/applyTheme'
import { recordView, getRecentlyViewed } from '@/lib/recentlyViewed'
import { getFavourites } from '@/lib/favourites'
import { publishDestination, fetchSharedDestination } from '@/lib/sharedDestinations'
import type { Destination } from '@/types'

type FlowState = 'loading' | 'missing' | 'map-enter' | 'fly-to' | 'panel-open'

// This device first (session, saved, recently viewed), then the shared copy
// on the server, so a link sent to someone else still opens.
async function resolveDestination(city: string): Promise<Destination | null> {
  try {
    const raw = sessionStorage.getItem(`wander_dest_${city}`)
    if (raw) return JSON.parse(raw) as Destination
  } catch { /* ignore */ }
  const local = getFavourites().find(d => d.city === city) ?? getRecentlyViewed().find(d => d.city === city)
  if (local) return local
  return fetchSharedDestination(city)
}

export function DestinationView() {
  const router = useRouter()
  const params = useParams()
  const { theme } = useTheme()
  const cityParam = decodeURIComponent(params.city as string)

  const [destination, setDestination] = useState<Destination | null>(null)
  const [flowState, setFlowState] = useState<FlowState>('loading')

  useEffect(() => {
    let cancelled = false
    resolveDestination(cityParam).then((dest) => {
      if (cancelled) return
      if (!dest) { setFlowState('missing'); return }
      sessionStorage.setItem(`wander_dest_${dest.city}`, JSON.stringify(dest))
      setDestination(dest)
      recordView(dest)
      publishDestination(dest)
      applyTheme(dest.culturalTheme, dest.weather?.condition)
      setFlowState('map-enter')
    })
    return () => { cancelled = true }
  }, [cityParam])

  function handleFlyComplete() {
    setFlowState('panel-open')
  }

  function handleBack() {
    resetTheme()
    // Someone who arrived from a shared link has no results to go back to.
    router.push(sessionStorage.getItem('wander_destinations') ? '/results' : '/discover')
  }

  if (flowState === 'missing') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-6 text-center"
        style={{ backgroundColor: 'var(--color-bg)', color: 'var(--color-text)' }}>
        <h1 className="text-3xl" style={{ fontFamily: 'var(--font-outfit)' }}>We couldn&apos;t find {cityParam}</h1>
        <p className="text-sm max-w-sm opacity-80">This link hasn&apos;t been shared from Wander yet. Find it, or somewhere like it, in a few taps.</p>
        <Link href="/discover" className="mono-cta inline-flex items-center justify-center min-h-11 px-6 rounded-[14px] text-sm font-semibold"
          style={{ backgroundColor: 'var(--color-accent)', color: 'var(--color-on-accent)' }}>
          Find a destination
        </Link>
      </div>
    )
  }

  if (!destination) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: 'var(--color-bg)' }}
      >
        <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin"
          style={{ borderColor: 'var(--color-accent)' }} />
      </div>
    )
  }

  return (
    <div
      className="relative min-h-screen overflow-hidden"
      style={{ backgroundColor: 'var(--color-bg)', transition: 'background-color 600ms ease-in-out' }}
    >
      <Navbar onBack={handleBack} />

      {/* Full-screen map */}
      <motion.div
        className="absolute inset-0"
        initial={{ opacity: 0 }}
        animate={{ opacity: flowState !== 'loading' ? 1 : 0 }}
        transition={{ duration: 1 }}
      >
        {flowState !== 'loading' && (
          <MapTransport
            lat={destination.coordinates.lat}
            lng={destination.coordinates.lng}
            cityName={destination.city}
            darkMode={theme !== 'light'}
            onFlyComplete={handleFlyComplete}
          />
        )}
      </motion.div>

      {/* Detail panel - slides up after fly-to completes */}
      <AnimatePresence>
        {flowState === 'panel-open' && (
          <DetailPanel destination={destination} onBack={handleBack} />
        )}
      </AnimatePresence>
    </div>
  )
}

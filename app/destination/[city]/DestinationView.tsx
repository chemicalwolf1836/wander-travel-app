'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { AnimatePresence, motion } from 'framer-motion'
import { useTheme } from 'next-themes'
import { Navbar } from '@/components/Navbar'
import { MapTransport } from '@/components/MapTransport'
import { DetailPanel } from '@/components/DetailPanel'
import { applyTheme, resetTheme } from '@/lib/applyTheme'
import { recordView } from '@/lib/recentlyViewed'
import type { Destination } from '@/types'

type FlowState = 'loading' | 'map-enter' | 'fly-to' | 'panel-open'

export function DestinationView() {
  const router = useRouter()
  const params = useParams()
  const { theme } = useTheme()
  const cityParam = decodeURIComponent(params.city as string)

  const [destination, setDestination] = useState<Destination | null>(null)
  const [flowState, setFlowState] = useState<FlowState>('loading')

  useEffect(() => {
    const raw = sessionStorage.getItem(`wander_dest_${cityParam}`)
    if (!raw) {
      router.push('/results')
      return
    }
    const dest: Destination = JSON.parse(raw)
    setDestination(dest)
    recordView(dest)
    applyTheme(dest.culturalTheme, dest.weather?.condition)
    setFlowState('map-enter')
  }, [cityParam, router])

  function handleFlyComplete() {
    setFlowState('panel-open')
  }

  function handleBack() {
    resetTheme()
    router.push('/results')
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

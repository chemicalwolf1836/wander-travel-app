'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { RefreshCw } from 'lucide-react'
import { Navbar } from '@/components/Navbar'
import { DestinationCard } from '@/components/DestinationCard'
import { SkeletonCard } from '@/components/SkeletonCard'
import { GlobeView } from '@/components/GlobeView'
import { CustomizationPanel } from '@/components/CustomizationPanel'
import { applyTheme } from '@/lib/applyTheme'
import type { Destination } from '@/types'

export default function ResultsPage() {
  const router = useRouter()
  const [destinations, setDestinations] = useState<Destination[]>([])
  const [activeIndex, setActiveIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [globeExiting, setGlobeExiting] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)

  useEffect(() => {
    const raw = sessionStorage.getItem('wander_destinations')
    if (!raw) {
      router.push('/discover')
      return
    }
    try {
      const parsed: Destination[] = JSON.parse(raw)
      setDestinations(parsed)
      setLoading(false)
    } catch {
      setError(true)
      setLoading(false)
    }
  }, [router])

  // Apply theme when active destination changes
  useEffect(() => {
    const dest = destinations[activeIndex]
    if (dest) {
      applyTheme(dest.culturalTheme, dest.weather?.condition)
    }
  }, [activeIndex, destinations])

  const handleCardHover = useCallback((index: number) => {
    setActiveIndex(index)
  }, [])

  const handleCardClick = useCallback((destination: Destination) => {
    setGlobeExiting(true)
    sessionStorage.setItem(`wander_dest_${destination.city}`, JSON.stringify(destination))
    setTimeout(() => {
      router.push(`/destination/${encodeURIComponent(destination.city)}`)
    }, 400)
  }, [router])

  if (error) {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center gap-4"
        style={{ backgroundColor: 'var(--color-bg)', color: 'var(--color-text)' }}
      >
        <p className="text-4xl">😕</p>
        <p className="text-lg">Something went wrong finding your destinations.</p>
        <button
          onClick={() => router.push('/discover')}
          className="flex items-center gap-2 px-6 py-3 rounded-full text-sm"
          style={{ backgroundColor: 'var(--color-accent)', color: 'var(--color-bg)' }}
        >
          <RefreshCw size={14} />
          Try Again
        </button>
      </div>
    )
  }

  return (
    <div
      className="min-h-screen"
      style={{ backgroundColor: 'var(--color-bg)', transition: 'background-color 600ms ease-in-out' }}
    >
      <Navbar onSettingsOpen={() => setSettingsOpen(!settingsOpen)} />

      <CustomizationPanel open={settingsOpen} onClose={() => setSettingsOpen(false)} />

      {/* Globe - full viewport height, sticky so cards scroll over it */}
      <div className="relative" style={{ height: 'calc(100vh - 64px)' }}>
        <div className="sticky top-16 w-full h-[calc(100vh-64px)] flex flex-col items-center justify-center">
          {loading ? (
            <div
              className="w-64 h-64 rounded-full border border-dashed animate-pulse opacity-20"
              style={{ borderColor: 'var(--color-accent)' }}
            />
          ) : (
            <GlobeView
              destinations={destinations}
              activeIndex={activeIndex}
              onPinClick={handleCardHover}
              exiting={globeExiting}
            />
          )}

          {loading && (
            <p
              className="absolute bottom-12 text-xs tracking-widest uppercase animate-pulse"
              style={{ color: 'var(--color-subtle)' }}
            >
              Finding your perfect destinations...
            </p>
          )}

          {/* Scroll hint */}
          {!loading && (
            <motion.p
              className="absolute bottom-8 text-xs tracking-widest uppercase"
              style={{ color: 'var(--color-subtle)' }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.5 }}
            >
              Scroll to explore
            </motion.p>
          )}
        </div>
      </div>

      {/* Cards - scroll in from below the globe */}
      <div
        className="relative z-10 px-6 pb-24"
        style={{ backgroundColor: 'var(--color-bg)', transition: 'background-color 600ms ease-in-out' }}
      >
        {/* Section label */}
        {!loading && (
          <motion.p
            className="text-center text-xs tracking-widest uppercase pt-16 pb-10"
            style={{ color: 'var(--color-subtle)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            Your destinations
          </motion.p>
        )}

        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-5"
          >
            {loading
              ? [0, 1, 2].map((i) => <SkeletonCard key={i} />)
              : destinations.map((dest, i) => (
                  <DestinationCard
                    key={dest.city}
                    destination={dest}
                    index={i}
                    isActive={activeIndex === i}
                    onHover={() => handleCardHover(i)}
                    onClick={() => handleCardClick(dest)}
                  />
                ))}
          </motion.div>
        </div>
      </div>
    </div>
  )
}

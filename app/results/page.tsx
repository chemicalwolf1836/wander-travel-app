'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { RefreshCw, MapPin, ArrowLeft } from 'lucide-react'
import { Navbar } from '@/components/Navbar'
import { DestinationCard } from '@/components/DestinationCard'
import { SkeletonCard } from '@/components/SkeletonCard'
import { WorldMap } from '@/components/WorldMap'
import { CustomizationPanel } from '@/components/CustomizationPanel'
import type { Destination } from '@/types'

function applyAccent(accent: string) {
  document.documentElement.style.setProperty('--color-accent', accent)
}
function clearAccent() {
  document.documentElement.style.removeProperty('--color-accent')
}

type View = 'map' | 'cards'

export default function ResultsPage() {
  const router = useRouter()
  const [destinations, setDestinations] = useState<Destination[]>([])
  const [activeIndex, setActiveIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [view, setView] = useState<View>('map')
  const [mapExiting, setMapExiting] = useState(false)
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

  // Shift accent color to match active destination
  useEffect(() => {
    const dest = destinations[activeIndex]
    if (dest) applyAccent(dest.culturalTheme.accent)
    return () => { clearAccent() }
  }, [activeIndex, destinations])

  const handlePinClick = useCallback((index: number) => {
    setActiveIndex(index)
    setView('cards')
  }, [])

  const handleCardHover = useCallback((index: number) => {
    setActiveIndex(index)
  }, [])

  const handleCardClick = useCallback((destination: Destination) => {
    setMapExiting(true)
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
      className="min-h-screen overflow-hidden"
      style={{ backgroundColor: 'var(--color-bg)', transition: 'background-color 600ms ease-in-out' }}
    >
      <Navbar onSettingsOpen={() => setSettingsOpen(!settingsOpen)} />
      <CustomizationPanel open={settingsOpen} onClose={() => setSettingsOpen(false)} />

      <AnimatePresence mode="wait">
        {view === 'map' ? (
          /* ── MAP VIEW ── */
          <motion.div
            key="map"
            className="fixed inset-0 pt-16 flex flex-col"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, ease: 'easeInOut' }}
          >
            {/* Map fills the space */}
            <div className="flex-1 relative">
              {loading ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-6">
                  <div
                    className="w-48 h-48 rounded-full border border-dashed animate-pulse opacity-20"
                    style={{ borderColor: 'var(--color-accent)' }}
                  />
                  <p
                    className="text-xs tracking-widest uppercase animate-pulse"
                    style={{ color: 'var(--color-subtle)' }}
                  >
                    Finding your perfect destinations...
                  </p>
                </div>
              ) : (
                <WorldMap
                  destinations={destinations}
                  activeIndex={activeIndex}
                  onPinClick={handlePinClick}
                  exiting={mapExiting}
                />
              )}
            </div>

            {/* CTA at bottom — fades in after map loads */}
            {!loading && (
              <motion.div
                className="flex-shrink-0 flex flex-col items-center gap-4 pb-10"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.2, duration: 0.6 }}
              >
                <p
                  className="text-xs tracking-widest uppercase"
                  style={{ color: 'var(--color-subtle)' }}
                >
                  {destinations.length} destinations found
                </p>
                <button
                  onClick={() => setView('cards')}
                  className="flex items-center gap-2 px-7 py-3 rounded-full text-sm font-medium transition-all hover:scale-105"
                  style={{
                    backgroundColor: 'var(--color-accent)',
                    color: 'var(--color-bg)',
                    boxShadow: `0 0 32px color-mix(in srgb, var(--color-accent) 45%, transparent)`,
                  }}
                >
                  <MapPin size={14} />
                  Explore your destinations
                </button>
              </motion.div>
            )}
          </motion.div>
        ) : (
          /* ── CARDS VIEW ── */
          <motion.div
            key="cards"
            className="min-h-screen pt-16"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, ease: 'easeInOut' }}
          >
            {/* Back to map */}
            <motion.div
              className="flex justify-center pt-10 pb-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <button
                onClick={() => setView('map')}
                className="flex items-center gap-2 text-xs tracking-widest uppercase opacity-50 hover:opacity-100 transition-opacity"
                style={{ color: 'var(--color-text)' }}
              >
                <ArrowLeft size={12} />
                Back to map
              </button>
            </motion.div>

            <p
              className="text-center text-xs tracking-widest uppercase pb-8"
              style={{ color: 'var(--color-subtle)' }}
            >
              Your destinations
            </p>

            <div className="px-6 pb-24 max-w-5xl mx-auto">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {destinations.map((dest, i) => (
                  <DestinationCard
                    key={dest.city}
                    destination={dest}
                    index={i}
                    isActive={activeIndex === i}
                    onHover={() => handleCardHover(i)}
                    onClick={() => handleCardClick(dest)}
                  />
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

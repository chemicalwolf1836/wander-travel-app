'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { RefreshCw, X, ArrowRight, Utensils, Landmark } from 'lucide-react'
import { Navbar } from '@/components/Navbar'
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

export default function ResultsPage() {
  const router = useRouter()
  const [destinations, setDestinations] = useState<Destination[]>([])
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [mapExiting, setMapExiting] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)

  useEffect(() => {
    const raw = sessionStorage.getItem('wander_destinations')
    if (!raw) { router.push('/discover'); return }
    try {
      setDestinations(JSON.parse(raw) as Destination[])
      setLoading(false)
    } catch {
      setError(true)
      setLoading(false)
    }
  }, [router])

  // Shift accent to match selected (or first) destination
  useEffect(() => {
    const i = selectedIndex ?? 0
    const dest = destinations[i]
    if (dest) applyAccent(dest.culturalTheme.accent)
    return () => { clearAccent() }
  }, [selectedIndex, destinations])

  const handlePinClick = useCallback((index: number) => {
    setSelectedIndex(index)
  }, [])

  const handleNavigate = useCallback((destination: Destination) => {
    setMapExiting(true)
    sessionStorage.setItem(`wander_dest_${destination.city}`, JSON.stringify(destination))
    setTimeout(() => {
      router.push(`/destination/${encodeURIComponent(destination.city)}`)
    }, 400)
  }, [router])

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4"
        style={{ backgroundColor: 'var(--color-bg)', color: 'var(--color-text)' }}>
        <p className="text-4xl">😕</p>
        <p className="text-lg">Something went wrong finding your destinations.</p>
        <button onClick={() => router.push('/discover')}
          className="flex items-center gap-2 px-6 py-3 rounded-full text-sm"
          style={{ backgroundColor: 'var(--color-accent)', color: 'var(--color-bg)' }}>
          <RefreshCw size={14} /> Try Again
        </button>
      </div>
    )
  }

  const selected = selectedIndex !== null ? destinations[selectedIndex] : null

  return (
    <div className="h-screen overflow-hidden"
      style={{ backgroundColor: 'var(--color-bg)', transition: 'background-color 600ms ease-in-out' }}>
      <Navbar onSettingsOpen={() => setSettingsOpen(!settingsOpen)} />
      <CustomizationPanel open={settingsOpen} onClose={() => setSettingsOpen(false)} />

      {/* Map — fills everything below navbar */}
      <div className="absolute inset-0 top-16">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-full gap-6">
            <div className="w-48 h-48 rounded-full border border-dashed animate-pulse opacity-20"
              style={{ borderColor: 'var(--color-accent)' }} />
            <p className="text-xs tracking-widest uppercase animate-pulse"
              style={{ color: 'var(--color-subtle)' }}>
              Finding your perfect destinations...
            </p>
          </div>
        ) : (
          <WorldMap
            destinations={destinations}
            activeIndex={selectedIndex ?? 0}
            onPinClick={handlePinClick}
            exiting={mapExiting}
          />
        )}

        {/* Hint when nothing is selected */}
        {!loading && selectedIndex === null && (
          <motion.p
            className="absolute bottom-8 left-0 right-0 text-center text-xs tracking-widest uppercase"
            style={{ color: 'var(--color-subtle)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.4 }}
          >
            Tap a pin to explore
          </motion.p>
        )}
      </div>

      {/* Dim backdrop when card is open */}
      <AnimatePresence>
        {selected && (
          <motion.div
            className="absolute inset-0 top-16 z-10"
            style={{ backgroundColor: 'rgba(0,0,0,0.35)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={() => setSelectedIndex(null)}
          />
        )}
      </AnimatePresence>

      {/* Destination card — slides up from bottom */}
      <AnimatePresence>
        {selected && (
          <motion.div
            key={selected.city}
            className="absolute bottom-0 left-0 right-0 z-20 rounded-t-3xl overflow-hidden"
            style={{
              backgroundColor: 'var(--color-card-bg)',
              borderTop: `1px solid color-mix(in srgb, ${selected.culturalTheme.accent} 30%, transparent)`,
              maxHeight: '62vh',
            }}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 32, stiffness: 280 }}
          >
            {/* Drag handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full opacity-30"
                style={{ backgroundColor: 'var(--color-text)' }} />
            </div>

            <div className="overflow-y-auto px-6 pb-8" style={{ maxHeight: 'calc(62vh - 24px)' }}>
              {/* Header row */}
              <div className="flex items-start justify-between mb-4 mt-1">
                <div className="flex-1 pr-4">
                  <h2
                    className="text-4xl md:text-5xl leading-tight mb-1"
                    style={{ fontFamily: 'var(--font-playfair)', color: 'var(--color-text)' }}
                  >
                    {selected.emoji} {selected.city}
                  </h2>
                  <p className="text-sm" style={{ color: 'var(--color-subtle)' }}>
                    {selected.flagEmoji} {selected.country}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedIndex(null)}
                  className="flex-shrink-0 mt-1 p-2 rounded-full hover:opacity-60 transition-opacity"
                  style={{ color: 'var(--color-text)' }}
                >
                  <X size={18} />
                </button>
              </div>

              {/* Tagline */}
              <p className="text-sm italic mb-4 leading-relaxed"
                style={{ color: selected.culturalTheme.accent }}>
                {selected.tagline}
              </p>

              {/* Description */}
              <p className="text-sm leading-relaxed mb-5 line-clamp-2"
                style={{ color: 'var(--color-text)', opacity: 0.8 }}>
                {selected.description}
              </p>

              {/* Quick info row */}
              <div className="flex gap-4 mb-6">
                {selected.attractions.length > 0 && (
                  <div className="flex-1">
                    <div className="flex items-center gap-1.5 mb-2">
                      <Landmark size={11} style={{ color: selected.culturalTheme.accent }} />
                      <span className="text-xs tracking-widest uppercase"
                        style={{ color: selected.culturalTheme.accent }}>See</span>
                    </div>
                    <div className="flex flex-col gap-1">
                      {selected.attractions.slice(0, 3).map((a) => (
                        <span key={a} className="text-xs" style={{ color: 'var(--color-text)', opacity: 0.75 }}>
                          {a}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {selected.food.dishes.length > 0 && (
                  <div className="flex-1">
                    <div className="flex items-center gap-1.5 mb-2">
                      <Utensils size={11} style={{ color: selected.culturalTheme.accent }} />
                      <span className="text-xs tracking-widest uppercase"
                        style={{ color: selected.culturalTheme.accent }}>Eat</span>
                    </div>
                    <div className="flex flex-col gap-1">
                      {selected.food.dishes.slice(0, 3).map((d) => (
                        <span key={d} className="text-xs" style={{ color: 'var(--color-text)', opacity: 0.75 }}>
                          {d}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* CTA */}
              <button
                onClick={() => handleNavigate(selected)}
                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl text-sm font-medium transition-all hover:scale-[1.02] active:scale-[0.98]"
                style={{
                  backgroundColor: selected.culturalTheme.accent,
                  color: selected.culturalTheme.background,
                  boxShadow: `0 0 28px color-mix(in srgb, ${selected.culturalTheme.accent} 40%, transparent)`,
                }}
              >
                Explore {selected.city}
                <ArrowRight size={15} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Loading skeleton cards (only during initial load) */}
      {loading && (
        <div className="absolute bottom-0 left-0 right-0 z-20 px-4 pb-6 grid grid-cols-1 gap-3">
          {[0, 1].map((i) => <SkeletonCard key={i} />)}
        </div>
      )}
    </div>
  )
}

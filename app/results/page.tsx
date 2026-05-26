'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { RefreshCw, ArrowRight, ArrowLeft, Utensils, Landmark } from 'lucide-react'
import { Navbar } from '@/components/Navbar'
import { WorldMap } from '@/components/WorldMap'
import { CustomizationPanel } from '@/components/CustomizationPanel'
import type { Destination } from '@/types'

function applyAccent(accent: string) {
  document.documentElement.style.setProperty('--color-accent', accent)
}
function clearAccent() {
  document.documentElement.style.removeProperty('--color-accent')
}

type View = 'map' | 'card'

export default function ResultsPage() {
  const router = useRouter()
  const [destinations, setDestinations] = useState<Destination[]>([])
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [view, setView] = useState<View>('map')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [navigating, setNavigating] = useState(false)
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

  useEffect(() => {
    const dest = destinations[selectedIndex]
    if (dest) applyAccent(dest.culturalTheme.accent)
    return () => { clearAccent() }
  }, [selectedIndex, destinations])

  const handlePinClick = useCallback((index: number) => {
    setSelectedIndex(index)
    setView('card')
  }, [])

  const handleNavigate = useCallback((destination: Destination) => {
    setNavigating(true)
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

  const selected = destinations[selectedIndex]

  return (
    <div className="h-screen overflow-hidden"
      style={{ backgroundColor: 'var(--color-bg)', transition: 'background-color 600ms ease-in-out' }}>
      <Navbar onSettingsOpen={() => setSettingsOpen(!settingsOpen)} />
      <CustomizationPanel open={settingsOpen} onClose={() => setSettingsOpen(false)} />

      <AnimatePresence mode="wait">

        {/* ── MAP VIEW ── */}
        {view === 'map' && (
          <motion.div
            key="map"
            className="absolute inset-0 top-16"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.45, ease: 'easeInOut' }}
          >
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
              <>
                <WorldMap
                  destinations={destinations}
                  activeIndex={selectedIndex}
                  onPinClick={handlePinClick}
                  exiting={navigating}
                />
                <motion.p
                  className="absolute bottom-8 left-0 right-0 text-center text-xs tracking-widest uppercase"
                  style={{ color: 'var(--color-subtle)' }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1.2 }}
                >
                  Tap a pin to explore
                </motion.p>
              </>
            )}
          </motion.div>
        )}

        {/* ── CARD VIEW ── */}
        {view === 'card' && selected && (
          <motion.div
            key={`card-${selected.city}`}
            className="absolute inset-0 top-16 flex flex-col items-center justify-center px-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.45, ease: 'easeInOut' }}
          >
            {/* Card */}
            <motion.div
              className="w-full rounded-3xl overflow-hidden"
              style={{
                maxWidth: 480,
                maxHeight: 'calc(100vh - 120px)',
                backgroundColor: 'var(--color-card-bg)',
                border: `1px solid color-mix(in srgb, ${selected.culturalTheme.accent} 25%, transparent)`,
                boxShadow: `0 0 60px color-mix(in srgb, ${selected.culturalTheme.accent} 20%, transparent), 0 24px 48px rgba(0,0,0,0.25)`,
              }}
              initial={{ scale: 0.94, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.1, ease: 'easeOut' }}
            >
              {/* Accent top bar */}
              <div className="h-0.5 w-full"
                style={{ background: `linear-gradient(90deg, transparent, ${selected.culturalTheme.accent}, transparent)` }} />

              <div className="overflow-y-auto px-7 py-7" style={{ maxHeight: 'calc(100vh - 136px)' }}>
                {/* City */}
                <h2
                  className="text-5xl md:text-6xl leading-none mb-1"
                  style={{ fontFamily: 'var(--font-playfair)', color: 'var(--color-text)' }}
                >
                  {selected.emoji} {selected.city}
                </h2>
                <p className="text-sm mb-4" style={{ color: 'var(--color-subtle)' }}>
                  {selected.flagEmoji} {selected.country}
                </p>

                {/* Tagline */}
                <p className="text-sm italic leading-relaxed mb-4"
                  style={{ color: selected.culturalTheme.accent }}>
                  {selected.tagline}
                </p>

                {/* Description */}
                <p className="text-sm leading-relaxed mb-6 line-clamp-3"
                  style={{ color: 'var(--color-text)', opacity: 0.8 }}>
                  {selected.description}
                </p>

                {/* See / Eat */}
                <div className="grid grid-cols-2 gap-4 mb-7">
                  {selected.attractions.length > 0 && (
                    <div>
                      <div className="flex items-center gap-1.5 mb-2.5">
                        <Landmark size={11} style={{ color: selected.culturalTheme.accent }} />
                        <span className="text-xs tracking-widest uppercase"
                          style={{ color: selected.culturalTheme.accent }}>See</span>
                      </div>
                      <div className="flex flex-col gap-1.5">
                        {selected.attractions.slice(0, 3).map((a) => (
                          <span key={a} className="text-xs leading-snug"
                            style={{ color: 'var(--color-text)', opacity: 0.72 }}>{a}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  {selected.food.dishes.length > 0 && (
                    <div>
                      <div className="flex items-center gap-1.5 mb-2.5">
                        <Utensils size={11} style={{ color: selected.culturalTheme.accent }} />
                        <span className="text-xs tracking-widest uppercase"
                          style={{ color: selected.culturalTheme.accent }}>Eat</span>
                      </div>
                      <div className="flex flex-col gap-1.5">
                        {selected.food.dishes.slice(0, 3).map((d) => (
                          <span key={d} className="text-xs leading-snug"
                            style={{ color: 'var(--color-text)', opacity: 0.72 }}>{d}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Explore CTA */}
                <button
                  onClick={() => handleNavigate(selected)}
                  className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl text-sm font-medium transition-all hover:scale-[1.02] active:scale-[0.98]"
                  style={{
                    backgroundColor: selected.culturalTheme.accent,
                    color: selected.culturalTheme.background,
                    boxShadow: `0 0 24px color-mix(in srgb, ${selected.culturalTheme.accent} 45%, transparent)`,
                  }}
                >
                  Explore {selected.city}
                  <ArrowRight size={15} />
                </button>
              </div>
            </motion.div>

            {/* Back to map */}
            <motion.button
              onClick={() => setView('map')}
              className="mt-5 flex items-center gap-2 text-xs tracking-widest uppercase opacity-50 hover:opacity-100 transition-opacity"
              style={{ color: 'var(--color-text)' }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              whileHover={{ opacity: 1 }}
            >
              <ArrowLeft size={12} />
              Back to map
            </motion.button>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  )
}

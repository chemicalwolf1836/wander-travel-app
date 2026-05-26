'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { RefreshCw, ArrowRight, ArrowLeft, Utensils, Landmark, Star, Calendar } from 'lucide-react'
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

interface WikiSummary {
  thumbnail?: { source: string }
  originalimage?: { source: string }
}

function useWikiImage(city: string) {
  const [src, setSrc] = useState<string | null>(null)
  useEffect(() => {
    setSrc(null)
    fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(city)}`)
      .then((r) => r.json())
      .then((d: WikiSummary) => {
        const url = d.originalimage?.source ?? d.thumbnail?.source ?? null
        setSrc(url)
      })
      .catch(() => null)
  }, [city])
  return src
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
    setTimeout(() => router.push(`/destination/${encodeURIComponent(destination.city)}`), 400)
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
          <motion.div key="map" className="absolute inset-0 top-16"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.45, ease: 'easeInOut' }}>
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
                <WorldMap destinations={destinations} activeIndex={selectedIndex}
                  onPinClick={handlePinClick} exiting={navigating} />
                <motion.p className="absolute bottom-8 left-0 right-0 text-center text-xs tracking-widest uppercase"
                  style={{ color: 'var(--color-subtle)' }}
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.2 }}>
                  Tap a pin to explore
                </motion.p>
              </>
            )}
          </motion.div>
        )}

        {/* ── CARD VIEW ── */}
        {view === 'card' && selected && (
          <motion.div key={`card-${selected.city}`}
            className="absolute inset-0 top-16 flex flex-col items-center justify-center px-4 md:px-8"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.45, ease: 'easeInOut' }}>

            <DestinationDetailCard
              destination={selected}
              onExplore={() => handleNavigate(selected)}
              onBack={() => setView('map')}
            />

          </motion.div>
        )}

      </AnimatePresence>
    </div>
  )
}

/* ── Destination detail card ── */
function DestinationDetailCard({
  destination: dest,
  onExplore,
  onBack,
}: {
  destination: Destination
  onExplore: () => void
  onBack: () => void
}) {
  const imageUrl = useWikiImage(dest.city)
  const theme = dest.culturalTheme

  return (
    <motion.div
      className="w-full flex flex-col"
      style={{ maxWidth: 1100, maxHeight: 'calc(100vh - 96px)' }}
      initial={{ scale: 0.96, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.4, delay: 0.1, ease: 'easeOut' }}
    >
      <div
        className="rounded-3xl overflow-hidden flex flex-col"
        style={{
          backgroundColor: 'var(--color-card-bg)',
          border: `1px solid color-mix(in srgb, ${theme.accent} 22%, transparent)`,
          boxShadow: `0 0 80px color-mix(in srgb, ${theme.accent} 18%, transparent), 0 32px 64px rgba(0,0,0,0.3)`,
          maxHeight: 'calc(100vh - 136px)',
        }}
      >
        {/* Hero image */}
        <div className="relative flex-shrink-0 overflow-hidden" style={{ height: 260 }}>
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={dest.city}
              className="w-full h-full object-cover"
              style={{ filter: 'brightness(0.72)' }}
            />
          ) : (
            <div className="w-full h-full"
              style={{ background: `linear-gradient(135deg, ${theme.primary}, ${theme.accent})`, opacity: 0.7 }} />
          )}
          {/* Gradient overlay */}
          <div className="absolute inset-0"
            style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 60%)' }} />

          {/* City name over image */}
          <div className="absolute bottom-0 left-0 right-0 px-8 pb-6">
            <h2 className="text-5xl md:text-6xl leading-none text-white mb-1"
              style={{ fontFamily: 'var(--font-playfair)' }}>
              {dest.emoji} {dest.city}
            </h2>
            <p className="text-sm text-white/70">{dest.flagEmoji} {dest.country} · {dest.region}</p>
          </div>
        </div>

        {/* Body — scrollable */}
        <div className="overflow-y-auto flex-1 px-8 py-6">

          {/* Tagline */}
          <p className="text-base italic leading-relaxed mb-4"
            style={{ color: theme.accent }}>
            {dest.tagline}
          </p>

          {/* Description */}
          <p className="text-sm leading-relaxed mb-6"
            style={{ color: 'var(--color-text)', opacity: 0.82 }}>
            {dest.description}
          </p>

          {/* 3-column info grid */}
          <div className="grid grid-cols-3 gap-6 mb-6">

            {/* See */}
            {dest.attractions.length > 0 && (
              <div>
                <div className="flex items-center gap-1.5 mb-3">
                  <Landmark size={12} style={{ color: theme.accent }} />
                  <span className="text-xs tracking-widest uppercase" style={{ color: theme.accent }}>See</span>
                </div>
                <div className="flex flex-col gap-2">
                  {dest.attractions.slice(0, 4).map((a) => (
                    <span key={a} className="text-xs leading-snug"
                      style={{ color: 'var(--color-text)', opacity: 0.75 }}>{a}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Eat */}
            {dest.food.dishes.length > 0 && (
              <div>
                <div className="flex items-center gap-1.5 mb-3">
                  <Utensils size={12} style={{ color: theme.accent }} />
                  <span className="text-xs tracking-widest uppercase" style={{ color: theme.accent }}>Eat</span>
                </div>
                <div className="flex flex-col gap-2">
                  {dest.food.dishes.slice(0, 4).map((d) => (
                    <span key={d} className="text-xs leading-snug"
                      style={{ color: 'var(--color-text)', opacity: 0.75 }}>{d}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Best for */}
            {dest.bestFor.length > 0 && (
              <div>
                <div className="flex items-center gap-1.5 mb-3">
                  <Star size={12} style={{ color: theme.accent }} />
                  <span className="text-xs tracking-widest uppercase" style={{ color: theme.accent }}>Best for</span>
                </div>
                <div className="flex flex-col gap-2">
                  {dest.bestFor.slice(0, 4).map((b) => (
                    <span key={b} className="text-xs leading-snug"
                      style={{ color: 'var(--color-text)', opacity: 0.75 }}>{b}</span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Best seasons row */}
          {dest.bestSeasons && dest.bestSeasons.length > 0 && (
            <div className="flex items-center gap-2 mb-6 flex-wrap">
              <Calendar size={12} style={{ color: theme.accent }} />
              <span className="text-xs tracking-widest uppercase" style={{ color: theme.accent }}>Best time</span>
              {dest.bestSeasons.map((s) => (
                <span key={s} className="text-xs px-2.5 py-0.5 rounded-full"
                  style={{
                    backgroundColor: `color-mix(in srgb, ${theme.accent} 15%, transparent)`,
                    color: theme.accent,
                    border: `1px solid color-mix(in srgb, ${theme.accent} 30%, transparent)`,
                  }}>
                  {s}
                </span>
              ))}
            </div>
          )}

          {/* CTA */}
          <button
            onClick={onExplore}
            className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl text-sm font-medium transition-all hover:scale-[1.015] active:scale-[0.99]"
            style={{
              backgroundColor: theme.accent,
              color: theme.background,
              boxShadow: `0 0 28px color-mix(in srgb, ${theme.accent} 40%, transparent)`,
            }}
          >
            Explore {dest.city}
            <ArrowRight size={15} />
          </button>
        </div>
      </div>

      {/* Back link below card */}
      <motion.button
        onClick={onBack}
        className="mt-4 flex items-center gap-2 text-xs tracking-widest uppercase self-center transition-opacity"
        style={{ color: 'var(--color-text)', opacity: 0.45 }}
        whileHover={{ opacity: 1 }}
      >
        <ArrowLeft size={12} /> Back to map
      </motion.button>
    </motion.div>
  )
}

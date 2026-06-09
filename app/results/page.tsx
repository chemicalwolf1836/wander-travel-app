'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { RefreshCw, ArrowLeft, RotateCcw, Plus } from 'lucide-react'
import { toast } from 'sonner'
import { Navbar } from '@/components/Navbar'
import { WorldMap } from '@/components/WorldMap'
import { CustomizationPanel } from '@/components/CustomizationPanel'
import { BottomCard } from '@/components/results/BottomCard'
import { DestinationDetailCard } from '@/components/results/DestinationDetailCard'
import { CompareCard } from '@/components/results/CompareCard'
import type { Destination, AppSettings, WeatherData } from '@/types'

const STORAGE_KEY = 'wander_settings'
function loadSettings(): Pick<AppSettings, 'mapStyle' | 'cardLayout'> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw) as AppSettings
  } catch { /* ignore */ }
  return { mapStyle: 'default', cardLayout: 'grid' }
}

function applyAccent(accent: string) {
  document.documentElement.style.setProperty('--color-accent', accent)
}
function clearAccent() {
  document.documentElement.style.removeProperty('--color-accent')
}

type View = 'split' | 'detail' | 'compare'

export default function ResultsPage() {
  const router = useRouter()
  const [destinations, setDestinations] = useState<Destination[]>([])
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)
  const [view, setView] = useState<View>('split')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [navigating, setNavigating] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [mapStyle, setMapStyle] = useState<AppSettings['mapStyle']>('default')
  const [weatherMap, setWeatherMap] = useState<Record<string, WeatherData>>({})
  const [cardsRevealed, setCardsRevealed] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [compareIndex, setCompareIndex] = useState<number | null>(null)

  useEffect(() => {
    const raw = sessionStorage.getItem('wander_destinations')
    if (!raw) { router.push('/discover'); return }
    try {
      const dests = JSON.parse(raw) as Destination[]
      setDestinations(dests)
      setLoading(false)
    } catch {
      setError(true)
      setLoading(false)
    }
  }, [router])

  // Trigger cinematic reveal shortly after destinations load
  useEffect(() => {
    if (destinations.length === 0) return
    const t = setTimeout(() => setCardsRevealed(true), 120)
    return () => clearTimeout(t)
  }, [destinations.length])

  // Prefetch weather for all destinations as soon as they load
  useEffect(() => {
    if (destinations.length === 0) return
    destinations.forEach(dest => {
      fetch(`/api/weather?city=${encodeURIComponent(dest.city)}&country=${dest.countryCode}`)
        .then(r => r.json())
        .then((d: WeatherData | null) => {
          if (d) setWeatherMap(prev => ({ ...prev, [dest.city]: d }))
        })
        .catch(() => null)
    })
  }, [destinations])

  useEffect(() => {
    const s = loadSettings()
    setMapStyle(s.mapStyle)
    const handler = (e: Event) => {
      const s = (e as CustomEvent<AppSettings>).detail
      setMapStyle(s.mapStyle)
    }
    window.addEventListener('wander-settings', handler)
    return () => window.removeEventListener('wander-settings', handler)
  }, [])

  // Accent follows hovered card, then selected — never clear mid-page to avoid flash
  useEffect(() => {
    const i = hoveredIndex ?? selectedIndex
    const dest = destinations[i]
    if (dest) applyAccent(dest.culturalTheme.accent)
  }, [hoveredIndex, selectedIndex, destinations])

  // Only clear accent when leaving the page entirely
  useEffect(() => {
    return () => { clearAccent() }
  }, [])

  // Keyboard navigation: ← → arrows cycle destinations in split view
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (view !== 'split' || destinations.length === 0) return
      if (e.key === 'ArrowRight') setSelectedIndex(i => (i + 1) % destinations.length)
      if (e.key === 'ArrowLeft') setSelectedIndex(i => (i - 1 + destinations.length) % destinations.length)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [view, destinations.length])

  const handleTryAgain = useCallback(() => {
    sessionStorage.removeItem('wander_destinations')
    router.push('/discover')
  }, [router])

  const handleCardClick = useCallback((index: number) => {
    setSelectedIndex(index)
    setView('detail')
  }, [])

  const handleNavigate = useCallback((destination: Destination) => {
    setNavigating(true)
    sessionStorage.setItem(`wander_dest_${destination.city}`, JSON.stringify(destination))
    setTimeout(() => router.push(`/destination/${encodeURIComponent(destination.city)}`), 400)
  }, [router])

  async function handleLoadMore() {
    setLoadingMore(true)
    try {
      const raw = sessionStorage.getItem('wander_preferences')
      const prefs = raw ? JSON.parse(raw) as { summary: string; climate: string; budget: string; travelStyle: string; foodPreferences: string; other: string } : null
      const existingCities = destinations.map(d => d.city).join(', ')
      const preferences = {
        // Include existing cities in summary so the cache key is unique from the first search
        summary: `${prefs?.summary ?? 'Show me more great destinations'} — not ${existingCities}`,
        climate: prefs?.climate ?? 'any',
        budget: prefs?.budget ?? 'any',
        travelStyle: prefs?.travelStyle ?? 'open',
        foodPreferences: prefs?.foodPreferences ?? 'anything',
        other: `Do NOT suggest any of these cities: ${existingCities}. Return 3 completely different destinations.`,
      }
      const res = await fetch('/api/suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ preferences }),
      })
      if (!res.ok) { toast.error("Couldn't load more destinations."); setLoadingMore(false); return }
      const more = await res.json() as Destination[]
      const combined = [...destinations, ...more.filter(m => !destinations.some(d => d.city === m.city))]
      setDestinations(combined)
      sessionStorage.setItem('wander_destinations', JSON.stringify(combined))
      setCardsRevealed(false)
      setTimeout(() => setCardsRevealed(true), 80)
    } catch {
      toast.error('Something went wrong.')
    }
    setLoadingMore(false)
  }

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

  const activeMapIndex = hoveredIndex ?? selectedIndex

  return (
    <div className="h-screen overflow-hidden"
      style={{ backgroundColor: 'var(--color-bg)', transition: 'background-color 600ms ease-in-out' }}>
      <Navbar onSettingsOpen={() => setSettingsOpen(!settingsOpen)} />
      <CustomizationPanel open={settingsOpen} onClose={() => setSettingsOpen(false)} />

      <AnimatePresence mode="wait">

        {/* ── SPLIT VIEW: map top, cards bottom ── */}
        {view === 'split' && (
          <motion.div key="split"
            className="absolute inset-0 top-16 flex flex-col"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}>

            {/* Map — fills space above card strip */}
            <div className="flex-1 relative min-h-0">
              {loading ? (
                <div className="flex flex-col items-center justify-center h-full gap-6">
                  <div className="w-40 h-40 rounded-full border border-dashed animate-pulse opacity-20"
                    style={{ borderColor: 'var(--color-accent)' }} />
                  <p className="text-xs tracking-widest uppercase animate-pulse"
                    style={{ color: 'var(--color-subtle)' }}>
                    Finding your perfect destinations…
                  </p>
                </div>
              ) : (
                <WorldMap
                  destinations={destinations}
                  activeIndex={activeMapIndex}
                  onPinClick={handleCardClick}
                  exiting={navigating}
                  mapStyle={mapStyle}
                />
              )}
            </div>

            {/* Cards — fixed-height strip at bottom */}
            {!loading && (
              <div
                className="flex-shrink-0 flex flex-col"
              >
                {/* Keyboard hint + controls */}
                <div className="flex items-center justify-between px-4 pt-2 pb-1">
                  <p className="text-xs tracking-widest uppercase opacity-30 hidden md:block" style={{ color: 'var(--color-text)' }}>
                    ← → to browse
                  </p>
                  <div className="flex items-center gap-3 ml-auto">
                    {compareIndex !== null && (
                      <span className="text-xs px-2 py-0.5 rounded-full animate-pulse"
                        style={{ backgroundColor: 'color-mix(in srgb, var(--color-accent) 15%, transparent)', color: 'var(--color-accent)' }}>
                        Pick second destination to compare
                      </span>
                    )}
                    <button
                      onClick={handleTryAgain}
                      className="flex items-center gap-1.5 text-xs opacity-40 hover:opacity-80 transition-opacity"
                      style={{ color: 'var(--color-text)' }}
                    >
                      <RotateCcw size={11} /> Try different preferences
                    </button>
                  </div>
                </div>
              </div>
            )}
            {!loading && (
              <div
                className="relative flex-shrink-0 overflow-hidden"
                style={{
                  backdropFilter: 'blur(20px) saturate(1.4)',
                  WebkitBackdropFilter: 'blur(20px) saturate(1.4)',
                  backgroundColor: 'color-mix(in srgb, var(--color-bg) 65%, transparent)',
                  borderTop: '1px solid color-mix(in srgb, var(--color-text) 8%, transparent)',
                }}
              >
                <div className="flex gap-4 p-4 overflow-x-auto">
                  {destinations.map((dest, i) => (
                    <BottomCard
                      key={dest.city}
                      destination={dest}
                      index={i}
                      isRevealed={cardsRevealed}
                      isHovered={hoveredIndex === i}
                      isSelected={selectedIndex === i}
                      anyHovered={hoveredIndex !== null}
                      isComparing={compareIndex === i}
                      onHover={() => setHoveredIndex(i)}
                      onLeave={() => setHoveredIndex(null)}
                      onClick={() => {
                        if (compareIndex !== null && compareIndex !== i) {
                          // Second card selected — show compare view
                          setView('compare' as View)
                          setSelectedIndex(i)
                        } else {
                          handleCardClick(i)
                        }
                      }}
                      onCompare={() => setCompareIndex(prev => prev === i ? null : i)}
                    />
                  ))}
                  {/* Load more */}
                  <motion.div
                    style={{ flex: '0 0 auto', perspective: 800 }}
                    initial={{ opacity: 0, scale: 0.88, y: 16 }}
                    animate={{ opacity: cardsRevealed ? 1 : 0, scale: cardsRevealed ? 1 : 0.88, y: cardsRevealed ? 0 : 16 }}
                    transition={{ type: 'spring', damping: 24, stiffness: 180, delay: cardsRevealed ? destinations.length * 0.18 : 0 }}
                  >
                    <button
                      onClick={handleLoadMore}
                      disabled={loadingMore}
                      className="flex flex-col items-center justify-center gap-2 rounded-2xl cursor-pointer disabled:opacity-50 transition-opacity hover:opacity-80"
                      style={{ height: 180, width: 120, border: '1.5px dashed color-mix(in srgb, var(--color-text) 20%, transparent)', color: 'var(--color-subtle)' }}
                    >
                      {loadingMore
                        ? <div className="w-5 h-5 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: 'var(--color-accent)', borderTopColor: 'transparent' }} />
                        : <Plus size={20} />}
                      <span className="text-xs">Show more</span>
                    </button>
                  </motion.div>
                </div>
                {/* Right-edge fade — signals the strip is scrollable */}
                <div
                  className="absolute right-0 top-0 bottom-0 w-16 pointer-events-none"
                  style={{
                    background: 'linear-gradient(to right, transparent, color-mix(in srgb, var(--color-bg) 90%, transparent))',
                  }}
                />
              </div>
            )}
          </motion.div>
        )}

        {/* ── DETAIL VIEW: single full card ── */}
        {view === 'detail' && destinations[selectedIndex] && (
          <motion.div key="detail"
            className="absolute inset-0 top-16 flex flex-col items-center justify-center px-4 md:px-8 overflow-y-auto py-6"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}>
            <DestinationDetailCard
              destination={destinations[selectedIndex]}
              weather={weatherMap[destinations[selectedIndex].city] ?? null}
              onExplore={() => handleNavigate(destinations[selectedIndex])}
              onBack={() => setView('split')}
            />
          </motion.div>
        )}

        {/* ── COMPARE VIEW: two cards side by side ── */}
        {view === 'compare' && destinations[compareIndex!] && destinations[selectedIndex] && (
          <motion.div key="compare"
            className="absolute inset-0 top-16 overflow-y-auto py-6 px-4"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}>
            <div className="max-w-5xl mx-auto">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg" style={{ fontFamily: 'var(--font-playfair)', color: 'var(--color-text)' }}>
                  Comparing destinations
                </h2>
                <button
                  onClick={() => { setView('split'); setCompareIndex(null) }}
                  className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full opacity-60 hover:opacity-100 transition-opacity"
                  style={{ color: 'var(--color-text)', border: '1px solid color-mix(in srgb, var(--color-text) 15%, transparent)' }}
                >
                  <ArrowLeft size={11} /> Back
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <CompareCard destination={destinations[compareIndex!]} weather={weatherMap[destinations[compareIndex!].city] ?? null} onExplore={() => handleNavigate(destinations[compareIndex!])} />
                <CompareCard destination={destinations[selectedIndex]} weather={weatherMap[destinations[selectedIndex].city] ?? null} onExplore={() => handleNavigate(destinations[selectedIndex])} />
              </div>
            </div>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  )
}

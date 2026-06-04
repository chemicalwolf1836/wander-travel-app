'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from 'framer-motion'
import { RefreshCw, ArrowRight, ArrowLeft, Utensils, Landmark, Compass, Calendar, X, Heart, Share2, RotateCcw, Luggage, Map as MapIcon, Sparkles, GitCompare, Plus } from 'lucide-react'
import { toast } from 'sonner'
import { Navbar } from '@/components/Navbar'
import { WorldMap } from '@/components/WorldMap'
import { CustomizationPanel } from '@/components/CustomizationPanel'
import { toggleFavourite, isFavourite } from '@/lib/favourites'
import { useDestinationImage } from '@/lib/useDestinationImage'
import { DestImage } from '@/components/DestImage'
import type { Destination, AppSettings, WeatherData } from '@/types'

type PackingCategory = { name: string; items: string[] }
type ItineraryDay = { day: number; title: string; morning: string; afternoon: string; evening: string; tip: string }

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


// Cache item-info results client-side so re-clicks and pre-hovers are instant
const itemInfoCache = new Map<string, { description?: string; image?: string }>()
const itemInfoFetching = new Set<string>()

function prefetchItem(name: string, city: string) {
  const key = `${name}::${city}`
  if (itemInfoCache.has(key) || itemInfoFetching.has(key)) return
  itemInfoFetching.add(key)
  fetch(`/api/item-info?name=${encodeURIComponent(name)}&context=${encodeURIComponent(city)}`)
    .then(r => r.json())
    .then((d: { description?: string; image?: string }) => {
      itemInfoCache.set(key, d)
      itemInfoFetching.delete(key)
    })
    .catch(() => itemInfoFetching.delete(key))
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

/* ── Flag image ── */
function Flag({ code, size = 24 }: { code: string; size?: number }) {
  return (
    <img
      src={`https://flagcdn.com/w40/${code.toLowerCase()}.png`}
      alt=""
      style={{
        width: size,
        height: 'auto',
        borderRadius: 2,
        boxShadow: '0 1px 4px rgba(0,0,0,0.4)',
        display: 'inline-block',
        flexShrink: 0,
        filter: 'saturate(1.6) contrast(1.1) brightness(1.05)',
      }}
    />
  )
}

/* ── Bottom strip card ── */
function BottomCard({
  destination: dest,
  index,
  isRevealed,
  isHovered,
  isSelected,
  anyHovered,
  isComparing,
  onHover,
  onLeave,
  onClick,
  onCompare,
}: {
  destination: Destination
  index: number
  isRevealed: boolean
  isHovered: boolean
  isSelected: boolean
  anyHovered: boolean
  isComparing: boolean
  onHover: () => void
  onLeave: () => void
  onClick: () => void
  onCompare: () => void
}) {
  const image = useDestinationImage(dest.city, dest.country)
  const [imgLoaded, setImgLoaded] = useState(false)
  const theme = dest.culturalTheme
  const active = isHovered || isSelected

  // 3D tilt
  const cardRef = useRef<HTMLDivElement>(null)
  const rawRotX = useMotionValue(0)
  const rawRotY = useMotionValue(0)
  const rotX = useSpring(rawRotX, { stiffness: 280, damping: 22 })
  const rotY = useSpring(rawRotY, { stiffness: 280, damping: 22 })
  const imgX = useTransform(rotY, [-12, 12], ['10px', '-10px'])
  const imgY = useTransform(rotX, [-10, 10], ['8px', '-8px'])

  function handleTiltMove(e: React.MouseEvent<HTMLDivElement>) {
    const el = cardRef.current
    if (!el) return
    const { left, top, width, height } = el.getBoundingClientRect()
    rawRotY.set(((e.clientX - left) / width - 0.5) * 22)
    rawRotX.set(-((e.clientY - top) / height - 0.5) * 16)
  }
  function handleTiltLeave() { rawRotX.set(0); rawRotY.set(0) }

  return (
    // Outer: cinematic reveal + perspective
    <motion.div
      style={{ flex: 1, minWidth: 200, perspective: 800 }}
      initial={{ opacity: 0, scale: 0.88, y: 16, filter: 'blur(8px)' }}
      animate={{
        opacity: isRevealed ? 1 : 0,
        scale: isRevealed ? 1 : 0.88,
        y: isRevealed ? 0 : 16,
        filter: isRevealed ? 'blur(0px)' : 'blur(8px)',
      }}
      transition={{
        opacity: { type: 'spring', damping: 24, stiffness: 180, delay: isRevealed ? index * 0.18 : 0 },
        scale: { type: 'spring', damping: 24, stiffness: 180, delay: isRevealed ? index * 0.18 : 0 },
        y: { type: 'spring', damping: 24, stiffness: 180, delay: isRevealed ? index * 0.18 : 0 },
        filter: { duration: 0.5, ease: 'easeOut', delay: isRevealed ? index * 0.18 : 0 },
      }}
    >
    {/* Inner: tilt + hover scale + dim */}
    <motion.div
      ref={cardRef}
      className="relative rounded-2xl overflow-hidden cursor-pointer"
      style={{
        height: 180,
        width: '100%',
        rotateX: rotX,
        rotateY: rotY,
        border: `1px solid ${active
          ? `color-mix(in srgb, ${theme.accent} 60%, transparent)`
          : 'color-mix(in srgb, var(--color-text) 10%, transparent)'}`,
        transition: 'border-color 0.3s ease',
      }}
      onMouseMove={handleTiltMove}
      onMouseEnter={onHover}
      onMouseLeave={() => { handleTiltLeave(); onLeave() }}
      onClick={onClick}
      animate={{ opacity: anyHovered && !isHovered ? 0.7 : 1 }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.25 }}
    >
      {/* Background image — gradient base shows instantly, photo (thumb) fades in over it */}
      <div className="absolute inset-0"
        style={{ background: `linear-gradient(135deg, ${theme.primary}, ${theme.accent})`, opacity: 0.7 }} />
      {image?.src && (
        <motion.img src={image.thumb} alt={dest.city} loading="lazy" decoding="async"
          onLoad={() => setImgLoaded(true)}
          className="absolute inset-0 w-full h-full object-cover"
          style={{ filter: 'brightness(1.02) saturate(1.25) contrast(1.08)', x: imgX, y: imgY, scale: 1.12, opacity: imgLoaded ? 1 : 0, transition: 'opacity 500ms ease' }} />
      )}

      {/* Gradient overlay */}
      <div className="absolute inset-0"
        style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.7) 45%, rgba(0,0,0,0.2) 80%, transparent 100%)' }} />


      {/* Content */}
      <div className="absolute inset-0 flex flex-col justify-end p-4"
        style={{ textShadow: '0 1px 4px rgba(0,0,0,1), 0 2px 12px rgba(0,0,0,0.9)' }}>
        <h3 className="text-xl leading-tight mb-0.5 font-semibold"
          style={{ fontFamily: 'var(--font-playfair)', color: '#ffffff' }}>
          {dest.city}
        </h3>
        <p className="text-xs mb-2 flex items-center gap-1.5" style={{ color: 'rgba(255,255,255,0.88)' }}>
          <Flag code={dest.countryCode} size={16} /> {dest.country}
        </p>

        <p
          className="text-xs italic line-clamp-1 mb-3 font-medium"
          style={{ color: theme.accent, filter: 'brightness(1.2) saturate(1.3)', textShadow: '0 1px 4px rgba(0,0,0,0.8)' }}
        >
          {dest.tagline}
        </p>

        <div className="flex gap-1.5">
          <button
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold"
            style={{
              backgroundColor: active ? theme.accent : 'rgba(255,255,255,0.18)',
              color: active ? theme.background : '#ffffff',
              transition: 'background-color 0.3s ease, color 0.3s ease',
            }}
            onClick={(e) => { e.stopPropagation(); onClick() }}
          >
            View details <ArrowRight size={11} />
          </button>
          <button
            className="flex items-center justify-center rounded-lg px-2"
            style={{
              backgroundColor: isComparing ? theme.accent : 'rgba(255,255,255,0.18)',
              color: isComparing ? theme.background : '#ffffff',
              transition: 'background-color 0.3s ease',
            }}
            onClick={(e) => { e.stopPropagation(); onCompare() }}
            title="Compare"
          >
            <GitCompare size={11} />
          </button>
        </div>
      </div>
    </motion.div>
    </motion.div>
  )
}

const WEATHER_EMOJI: Record<string, string> = {
  Clear: '☀️', Clouds: '⛅', Rain: '🌧️', Drizzle: '🌦️',
  Snow: '❄️', Thunderstorm: '⛈️', Mist: '🌫️', Fog: '🌫️', Haze: '🌫️',
}

/* ── Full detail card (used in detail view) ── */
function DestinationDetailCard({
  destination: dest,
  weather,
  onExplore,
  onBack,
}: {
  destination: Destination
  weather: WeatherData | null
  onExplore: () => void
  onBack: () => void
}) {
  const image = useDestinationImage(dest.city, dest.country)
  const imageUrl = image?.src ?? null
  const theme = dest.culturalTheme
  const [activeItem, setActiveItem] = useState<string | null>(null)
  const [fav, setFav] = useState(() => isFavourite(dest.city))
  const [shared, setShared] = useState(false)
  const [showPacking, setShowPacking] = useState(false)
  const [showItinerary, setShowItinerary] = useState(false)
  const [showSimilar, setShowSimilar] = useState(false)
  const [showShareCard, setShowShareCard] = useState(false)

  function handleFav() {
    const next = toggleFavourite(dest)
    setFav(next)
  }

  async function handleShare() {
    setShowShareCard(true)
  }

  return (
    <motion.div className="w-full flex flex-col"
      style={{ maxWidth: 1100, maxHeight: 'calc(100vh - 96px)' }}
      initial={{ scale: 0.96, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.4, delay: 0.05, ease: 'easeOut' }}>

      <div className="rounded-3xl overflow-hidden flex flex-col"
        style={{
          backgroundColor: 'var(--color-card-bg)',
          border: `1px solid color-mix(in srgb, ${theme.accent} 22%, transparent)`,
          boxShadow: `0 0 80px color-mix(in srgb, ${theme.accent} 18%, transparent), 0 32px 64px rgba(0,0,0,0.3)`,
          maxHeight: 'calc(100vh - 136px)',
        }}>

        {/* Hero */}
        <div className="relative flex-shrink-0 overflow-hidden" style={{ height: 260 }}>
          {image?.src ? (
            <DestImage src={image.src} thumb={image.thumb} alt={dest.city}
              filter="brightness(0.9) saturate(1.2) contrast(1.05)" eager />
          ) : (
            <div className="w-full h-full"
              style={{ background: `linear-gradient(135deg, ${theme.primary}, ${theme.accent})` }} />
          )}
          <div className="absolute inset-0"
            style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.1) 50%, transparent 100%)' }} />

          {/* Top-right action buttons */}
          <div className="absolute top-4 right-4 flex gap-2">
            <motion.button onClick={handleShare} whileTap={{ scale: 0.9 }}
              className="w-9 h-9 rounded-full flex items-center justify-center"
              style={{ backgroundColor: 'rgba(0,0,0,0.45)', color: 'white' }}
              title="Share destination">
              {shared ? <span className="text-xs">✓</span> : <Share2 size={14} />}
            </motion.button>
            <motion.button onClick={handleFav} whileTap={{ scale: 0.9 }}
              className="w-9 h-9 rounded-full flex items-center justify-center"
              style={{ backgroundColor: 'rgba(0,0,0,0.45)', color: fav ? theme.accent : 'white' }}
              title={fav ? 'Remove from saved' : 'Save destination'}>
              <Heart size={14} fill={fav ? theme.accent : 'none'} />
            </motion.button>
          </div>

          <div className="absolute bottom-0 left-0 right-0 px-8 pb-6">
            <h2 className="text-5xl md:text-6xl leading-none text-white mb-1"
              style={{ fontFamily: 'var(--font-playfair)', textShadow: '0 2px 12px rgba(0,0,0,0.6)' }}>
              {dest.emoji} {dest.city}
            </h2>
            <div className="flex items-center gap-3 flex-wrap">
              <p className="text-sm flex items-center gap-2" style={{ color: 'rgba(255,255,255,0.9)', textShadow: '0 1px 6px rgba(0,0,0,0.6)' }}>
                <Flag code={dest.countryCode} size={20} /> {dest.country} · {dest.region}
              </p>
              {weather && (
                <span className="text-sm" style={{ color: 'rgba(255,255,255,0.85)', textShadow: '0 1px 6px rgba(0,0,0,0.6)' }}>
                  {WEATHER_EMOJI[weather.condition] ?? '🌡️'} {weather.temp}°C · {weather.description}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 px-8 py-6">
          <p className="text-base italic leading-relaxed mb-3 font-medium"
            style={{ color: theme.accent, filter: 'brightness(1.15) saturate(1.2)' }}>
            {dest.tagline}
          </p>
          <p className="text-sm leading-relaxed mb-6" style={{ color: 'var(--color-text)' }}>
            {dest.description}
          </p>

          {/* Divider */}
          <div className="mb-6" style={{ height: 1, backgroundColor: 'color-mix(in srgb, var(--color-text) 8%, transparent)' }} />

          {/* See + Eat — two columns */}
          <div className="grid grid-cols-2 gap-8 mb-6">
            {dest.attractions.length > 0 && (
              <div>
                <div className="flex items-center gap-1.5 mb-3">
                  <Landmark size={12} style={{ color: theme.accent }} />
                  <span className="text-xs tracking-widest uppercase" style={{ color: theme.accent }}>See</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {dest.attractions.slice(0, 5).map((a) => (
                    <ItemChip key={a} label={a} accent={theme.accent} onClick={() => setActiveItem(a)} onPrefetch={() => prefetchItem(a, dest.city)} />
                  ))}
                </div>
              </div>
            )}
            {dest.food.dishes.length > 0 && (
              <div>
                <div className="flex items-center gap-1.5 mb-2">
                  <Utensils size={12} style={{ color: theme.accent }} />
                  <span className="text-xs tracking-widest uppercase" style={{ color: theme.accent }}>Eat</span>
                </div>
                {dest.food.summary && (
                  <p className="text-xs italic leading-snug mb-3" style={{ color: 'var(--color-subtle)' }}>
                    {dest.food.summary}
                  </p>
                )}
                <div className="flex flex-wrap gap-2">
                  {dest.food.dishes.slice(0, 5).map((d) => (
                    <ItemChip key={d} label={d} accent={theme.accent} onClick={() => setActiveItem(d)} onPrefetch={() => prefetchItem(d, dest.city)} />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Best for — full-width experience row */}
          {dest.bestFor.length > 0 && (
            <div className="mb-5">
              <div className="flex items-center gap-1.5 mb-2.5">
                <Compass size={12} style={{ color: 'var(--color-subtle)' }} />
                <span className="text-xs tracking-widest uppercase" style={{ color: 'var(--color-subtle)' }}>Best for</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {dest.bestFor.slice(0, 6).map((b) => (
                  <ExperienceChip key={b} label={b} onClick={() => setActiveItem(b)} onPrefetch={() => prefetchItem(b, dest.city)} />
                ))}
              </div>
            </div>
          )}

          {/* Best time — grouped with best for as trip-planning context */}
          {dest.bestSeasons && dest.bestSeasons.length > 0 && (
            <div className="flex items-center gap-2 mb-6 flex-wrap">
              <Calendar size={12} style={{ color: 'var(--color-subtle)' }} />
              <span className="text-xs tracking-widest uppercase" style={{ color: 'var(--color-subtle)' }}>Best time</span>
              {dest.bestSeasons.map((s) => (
                <span key={s} className="text-xs px-2.5 py-0.5 rounded-full"
                  style={{
                    backgroundColor: 'color-mix(in srgb, var(--color-text) 6%, transparent)',
                    color: 'var(--color-subtle)',
                    border: '1px solid color-mix(in srgb, var(--color-text) 12%, transparent)',
                  }}>{s}</span>
              ))}
            </div>
          )}

          <AnimatePresence>
            {activeItem && (
              <ItemModal item={activeItem} city={dest.city} accent={theme.accent} onClose={() => setActiveItem(null)} />
            )}
            {showPacking && (
              <PackingModal destination={dest} accent={theme.accent} onClose={() => setShowPacking(false)} />
            )}
            {showItinerary && (
              <ItineraryModal destination={dest} accent={theme.accent} onClose={() => setShowItinerary(false)} />
            )}
            {showSimilar && (
              <SimilarModal destination={dest} accent={theme.accent} onClose={() => setShowSimilar(false)} />
            )}
            {showShareCard && (
              <ShareCardModal destination={dest} imageUrl={imageUrl} onClose={() => setShowShareCard(false)} />
            )}
          </AnimatePresence>

          {/* Practical info row */}
          {(dest.currency || dest.language || dest.visaInfo) && (
            <div className="flex flex-wrap gap-4 mb-6 text-xs" style={{ color: 'var(--color-subtle)' }}>
              {dest.currency && <span>💱 {dest.currency}</span>}
              {dest.language && <span>🗣️ {dest.language}</span>}
              {dest.visaInfo && <span>🛂 {dest.visaInfo}</span>}
            </div>
          )}

          {/* Quick action buttons */}
          <div className="grid grid-cols-3 gap-2 mb-3">
            {[
              { icon: <Luggage size={13} />, label: 'Packing list', action: () => setShowPacking(true) },
              { icon: <MapIcon size={13} />, label: 'Itinerary', action: () => setShowItinerary(true) },
              { icon: <Sparkles size={13} />, label: 'Similar', action: () => setShowSimilar(true) },
            ].map(({ icon, label, action }) => (
              <button key={label} onClick={action}
                className="flex flex-col items-center gap-1 py-3 rounded-xl text-xs font-medium transition-all hover:scale-[1.03]"
                style={{
                  backgroundColor: 'color-mix(in srgb, var(--color-accent) 8%, transparent)',
                  color: 'var(--color-accent)',
                  border: '1px solid color-mix(in srgb, var(--color-accent) 18%, transparent)',
                }}>
                {icon}{label}
              </button>
            ))}
          </div>

          <button onClick={onExplore}
            className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl text-sm font-semibold transition-all hover:scale-[1.015] active:scale-[0.99]"
            style={{
              backgroundColor: theme.accent,
              color: theme.background,
              filter: 'brightness(1.1) saturate(1.2)',
              boxShadow: `0 0 40px color-mix(in srgb, ${theme.accent} 55%, transparent), 0 4px 16px rgba(0,0,0,0.3)`,
            }}>
            Explore {dest.city} <ArrowRight size={15} />
          </button>
        </div>
      </div>

      <motion.button onClick={onBack}
        className="mt-4 flex items-center gap-2 text-xs tracking-widest uppercase self-center transition-opacity"
        style={{ color: 'var(--color-text)', opacity: 0.45 }}
        whileHover={{ opacity: 1 }}>
        <ArrowLeft size={12} /> Back to destinations
      </motion.button>
    </motion.div>
  )
}

/* ── Clickable item chip ── */
function ItemChip({ label, accent, onClick, onPrefetch }: { label: string; accent: string; onClick: () => void; onPrefetch?: () => void }) {
  return (
    <motion.button
      onClick={onClick}
      onHoverStart={onPrefetch}
      className="text-xs px-3 py-1.5 rounded-full"
      style={{
        color: accent,
        backgroundColor: `color-mix(in srgb, ${accent} 10%, transparent)`,
        border: `1px solid color-mix(in srgb, ${accent} 22%, transparent)`,
      }}
      whileHover={{
        backgroundColor: accent,
        color: '#fff',
        scale: 1.04,
      }}
      whileTap={{ scale: 0.96 }}
      transition={{ duration: 0.18 }}
    >
      {label}
    </motion.button>
  )
}

/* ── Experience vibe chip (Best for) — subtler than ItemChip ── */
function ExperienceChip({ label, onClick, onPrefetch }: { label: string; onClick: () => void; onPrefetch?: () => void }) {
  return (
    <motion.button
      onClick={onClick}
      onHoverStart={onPrefetch}
      className="text-xs px-3 py-1.5 rounded-full"
      style={{
        color: 'var(--color-subtle)',
        backgroundColor: 'color-mix(in srgb, var(--color-text) 5%, transparent)',
        border: '1px solid color-mix(in srgb, var(--color-text) 10%, transparent)',
      }}
      whileHover={{
        backgroundColor: 'color-mix(in srgb, var(--color-text) 12%, transparent)',
        color: 'var(--color-text)',
        scale: 1.04,
      }}
      whileTap={{ scale: 0.96 }}
      transition={{ duration: 0.18 }}
    >
      {label}
    </motion.button>
  )
}

/* ── Compare card ── */
function CompareCard({ destination: dest, weather, onExplore }: { destination: Destination; weather: WeatherData | null; onExplore: () => void }) {
  const image = useDestinationImage(dest.city, dest.country)
  const theme = dest.culturalTheme
  return (
    <div className="rounded-3xl overflow-hidden flex flex-col h-full"
      style={{
        backgroundColor: 'var(--color-card-bg)',
        border: `1px solid color-mix(in srgb, ${theme.accent} 22%, transparent)`,
        boxShadow: `0 0 40px color-mix(in srgb, ${theme.accent} 12%, transparent)`,
      }}>
      <div className="relative flex-shrink-0 overflow-hidden" style={{ height: 180 }}>
        {image?.src
          ? <DestImage src={image.src} thumb={image.thumb} alt={dest.city} filter="brightness(0.85) saturate(1.2)" />
          : <div className="w-full h-full" style={{ background: `linear-gradient(135deg, ${theme.primary}, ${theme.accent})` }} />}
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.75) 0%, transparent 60%)' }} />
        <div className="absolute bottom-0 left-0 right-0 px-5 pb-4">
          <h3 className="text-3xl text-white leading-none" style={{ fontFamily: 'var(--font-playfair)' }}>{dest.emoji} {dest.city}</h3>
          <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.8)' }}>{dest.country} · {dest.region}</p>
        </div>
      </div>
      <div className="px-5 py-4 flex flex-col gap-3 flex-1">
        <p className="text-sm italic" style={{ color: theme.accent }}>{dest.tagline}</p>
        {weather && <p className="text-xs" style={{ color: 'var(--color-subtle)' }}>🌡️ {weather.temp}°C · {weather.description}</p>}
        <div>
          <p className="text-xs uppercase tracking-widest mb-1.5" style={{ color: 'var(--color-subtle)' }}>Highlights</p>
          <div className="flex flex-wrap gap-1.5">
            {dest.attractions.slice(0, 3).map(a => (
              <span key={a} className="text-xs px-2.5 py-1 rounded-full" style={{ backgroundColor: `color-mix(in srgb, ${theme.accent} 10%, transparent)`, color: theme.accent, border: `1px solid color-mix(in srgb, ${theme.accent} 20%, transparent)` }}>{a}</span>
            ))}
          </div>
        </div>
        <div>
          <p className="text-xs uppercase tracking-widest mb-1.5" style={{ color: 'var(--color-subtle)' }}>Must eat</p>
          <p className="text-xs" style={{ color: 'var(--color-text)' }}>{dest.food.dishes.slice(0, 3).join(' · ')}</p>
        </div>
        {dest.bestSeasons && dest.bestSeasons.length > 0 && (
          <p className="text-xs" style={{ color: 'var(--color-subtle)' }}>📅 Best: {dest.bestSeasons.join(', ')}</p>
        )}
        {(dest.currency || dest.language) && (
          <div className="flex gap-3 text-xs" style={{ color: 'var(--color-subtle)' }}>
            {dest.currency && <span>💱 {dest.currency}</span>}
            {dest.language && <span>🗣️ {dest.language}</span>}
          </div>
        )}
        <button onClick={onExplore}
          className="w-full flex items-center justify-center gap-1.5 py-3 rounded-xl text-sm font-semibold mt-auto"
          style={{ backgroundColor: theme.accent, color: theme.background }}>
          Explore <ArrowRight size={13} />
        </button>
      </div>
    </div>
  )
}

/* ── Shared modal shell ── */
function ModalShell({ accent, onClose, children }: { accent: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center p-6"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <div className="absolute inset-0" style={{ backgroundColor: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)' }} />
      <motion.div
        className="relative rounded-3xl overflow-hidden flex flex-col z-10 w-full"
        style={{
          maxWidth: 560, maxHeight: '85vh',
          backgroundColor: 'var(--color-card-bg)',
          border: `1px solid color-mix(in srgb, ${accent} 28%, transparent)`,
          boxShadow: `0 0 60px color-mix(in srgb, ${accent} 22%, transparent), 0 24px 48px rgba(0,0,0,0.5)`,
        }}
        initial={{ scale: 0.88, y: 20, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        exit={{ scale: 0.9, y: 12, opacity: 0 }}
        transition={{ type: 'spring', damping: 22, stiffness: 300 }}
        onClick={e => e.stopPropagation()}
      >
        {children}
      </motion.div>
    </motion.div>
  )
}

/* ── Packing list modal ── */
function PackingModal({ destination: dest, accent, onClose }: { destination: Destination; accent: string; onClose: () => void }) {
  const [categories, setCategories] = useState<PackingCategory[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [tripDays, setTripDays] = useState(7)

  async function fetchPacking(days: number) {
    setLoading(true)
    try {
      const res = await fetch('/api/packing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ city: dest.city, country: dest.country, bestSeasons: dest.bestSeasons, tripDays: days }),
      })
      if (res.ok) setCategories(await res.json() as PackingCategory[])
    } catch { /* ignore */ }
    setLoading(false)
  }

  useEffect(() => { fetchPacking(tripDays) }, [])

  return (
    <ModalShell accent={accent} onClose={onClose}>
      <div className="flex items-center justify-between px-6 py-4 border-b flex-shrink-0" style={{ borderColor: 'color-mix(in srgb, var(--color-text) 8%, transparent)' }}>
        <div className="flex items-center gap-2">
          <Luggage size={16} style={{ color: accent }} />
          <h3 className="text-lg" style={{ fontFamily: 'var(--font-playfair)', color: 'var(--color-text)' }}>Packing list for {dest.city}</h3>
        </div>
        <button onClick={onClose} className="w-7 h-7 rounded-full flex items-center justify-center" style={{ backgroundColor: 'color-mix(in srgb, var(--color-text) 8%, transparent)', color: 'var(--color-subtle)' }}><X size={14} /></button>
      </div>
      <div className="flex items-center gap-2 px-6 py-3 border-b flex-shrink-0" style={{ borderColor: 'color-mix(in srgb, var(--color-text) 6%, transparent)' }}>
        <span className="text-xs" style={{ color: 'var(--color-subtle)' }}>Trip length:</span>
        {[3, 5, 7, 10, 14].map(d => (
          <button key={d} onClick={() => { setTripDays(d); fetchPacking(d) }}
            className="text-xs px-2.5 py-1 rounded-full transition-colors"
            style={{
              backgroundColor: tripDays === d ? accent : 'color-mix(in srgb, var(--color-text) 8%, transparent)',
              color: tripDays === d ? '#fff' : 'var(--color-subtle)',
            }}>{d}d</button>
        ))}
      </div>
      <div className="overflow-y-auto flex-1 px-6 py-4">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-6 h-6 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: accent, borderTopColor: 'transparent' }} />
          </div>
        ) : categories ? (
          <div className="grid grid-cols-2 gap-4">
            {categories.map(cat => (
              <div key={cat.name}>
                <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: accent }}>{cat.name}</p>
                <ul className="space-y-1">
                  {cat.items.map(item => (
                    <li key={item} className="flex items-start gap-2 text-xs" style={{ color: 'var(--color-text)' }}>
                      <span style={{ color: accent, marginTop: 2 }}>·</span>{item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        ) : <p className="text-sm text-center py-8" style={{ color: 'var(--color-subtle)' }}>Failed to load. Try again.</p>}
      </div>
    </ModalShell>
  )
}

/* ── Itinerary modal ── */
function ItineraryModal({ destination: dest, accent, onClose }: { destination: Destination; accent: string; onClose: () => void }) {
  const [days, setDays] = useState<ItineraryDay[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [tripDays, setTripDays] = useState(5)

  async function fetchItinerary(n: number) {
    setLoading(true)
    try {
      const res = await fetch('/api/itinerary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ city: dest.city, country: dest.country, attractions: dest.attractions, dishes: dest.food.dishes, bestFor: dest.bestFor, tripDays: n }),
      })
      if (res.ok) setDays(await res.json() as ItineraryDay[])
    } catch { /* ignore */ }
    setLoading(false)
  }

  useEffect(() => { fetchItinerary(tripDays) }, [])

  return (
    <ModalShell accent={accent} onClose={onClose}>
      <div className="flex items-center justify-between px-6 py-4 border-b flex-shrink-0" style={{ borderColor: 'color-mix(in srgb, var(--color-text) 8%, transparent)' }}>
        <div className="flex items-center gap-2">
          <MapIcon size={16} style={{ color: accent }} />
          <h3 className="text-lg" style={{ fontFamily: 'var(--font-playfair)', color: 'var(--color-text)' }}>{dest.city} itinerary</h3>
        </div>
        <button onClick={onClose} className="w-7 h-7 rounded-full flex items-center justify-center" style={{ backgroundColor: 'color-mix(in srgb, var(--color-text) 8%, transparent)', color: 'var(--color-subtle)' }}><X size={14} /></button>
      </div>
      <div className="flex items-center gap-2 px-6 py-3 border-b flex-shrink-0" style={{ borderColor: 'color-mix(in srgb, var(--color-text) 6%, transparent)' }}>
        <span className="text-xs" style={{ color: 'var(--color-subtle)' }}>Days:</span>
        {[3, 5, 7, 10].map(d => (
          <button key={d} onClick={() => { setTripDays(d); fetchItinerary(d) }}
            className="text-xs px-2.5 py-1 rounded-full transition-colors"
            style={{ backgroundColor: tripDays === d ? accent : 'color-mix(in srgb, var(--color-text) 8%, transparent)', color: tripDays === d ? '#fff' : 'var(--color-subtle)' }}>{d}</button>
        ))}
      </div>
      <div className="overflow-y-auto flex-1 px-6 py-4 space-y-5">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-6 h-6 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: accent, borderTopColor: 'transparent' }} />
          </div>
        ) : days ? days.map(d => (
          <div key={d.day}>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ backgroundColor: `color-mix(in srgb, ${accent} 15%, transparent)`, color: accent }}>Day {d.day}</span>
              <p className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>{d.title}</p>
            </div>
            {[['Morning', d.morning], ['Afternoon', d.afternoon], ['Evening', d.evening]].map(([label, text]) => (
              <div key={label} className="flex gap-3 mb-1.5">
                <span className="text-xs w-16 flex-shrink-0 pt-0.5" style={{ color: 'var(--color-subtle)' }}>{label}</span>
                <p className="text-xs leading-relaxed" style={{ color: 'var(--color-text)' }}>{text}</p>
              </div>
            ))}
            {d.tip && <p className="text-xs italic mt-1.5 pl-1 border-l-2" style={{ color: accent, borderColor: `color-mix(in srgb, ${accent} 40%, transparent)` }}>💡 {d.tip}</p>}
          </div>
        )) : <p className="text-sm text-center py-8" style={{ color: 'var(--color-subtle)' }}>Failed to load. Try again.</p>}
      </div>
    </ModalShell>
  )
}

/* ── Similar destinations modal ── */
function SimilarModal({ destination: dest, accent, onClose }: { destination: Destination; accent: string; onClose: () => void }) {
  const [similar, setSimilar] = useState<Destination[] | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/suggest', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        preferences: {
          summary: `Destinations with a similar vibe and feel to ${dest.city} — ${dest.tagline}`,
          climate: 'similar climate',
          budget: 'any',
          travelStyle: dest.bestFor.slice(0, 3).join(', ') || 'open',
          foodPreferences: 'similar cuisine culture',
          other: `Must not include ${dest.city}. Similar cultural atmosphere.`,
        },
      }),
    })
      .then(r => r.json())
      .then((d: Destination[]) => setSimilar(d.filter(s => s.city !== dest.city)))
      .catch(() => null)
      .finally(() => setLoading(false))
  }, [])

  return (
    <ModalShell accent={accent} onClose={onClose}>
      <div className="flex items-center justify-between px-6 py-4 border-b flex-shrink-0" style={{ borderColor: 'color-mix(in srgb, var(--color-text) 8%, transparent)' }}>
        <div className="flex items-center gap-2">
          <Sparkles size={16} style={{ color: accent }} />
          <h3 className="text-lg" style={{ fontFamily: 'var(--font-playfair)', color: 'var(--color-text)' }}>Similar to {dest.city}</h3>
        </div>
        <button onClick={onClose} className="w-7 h-7 rounded-full flex items-center justify-center" style={{ backgroundColor: 'color-mix(in srgb, var(--color-text) 8%, transparent)', color: 'var(--color-subtle)' }}><X size={14} /></button>
      </div>
      <div className="overflow-y-auto flex-1 px-6 py-4">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-6 h-6 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: accent, borderTopColor: 'transparent' }} />
          </div>
        ) : similar && similar.length > 0 ? (
          <div className="space-y-3">
            {similar.map(s => (
              <div key={s.city} className="flex items-start gap-3 p-3 rounded-2xl"
                style={{ backgroundColor: 'color-mix(in srgb, var(--color-text) 4%, transparent)', border: '1px solid color-mix(in srgb, var(--color-text) 8%, transparent)' }}>
                <span className="text-2xl">{s.flagEmoji}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm" style={{ color: 'var(--color-text)' }}>{s.city}</p>
                  <p className="text-xs mb-1" style={{ color: 'var(--color-subtle)' }}>{s.country} · {s.region}</p>
                  <p className="text-xs italic line-clamp-2" style={{ color: s.culturalTheme.accent }}>{s.tagline}</p>
                </div>
              </div>
            ))}
          </div>
        ) : <p className="text-sm text-center py-8" style={{ color: 'var(--color-subtle)' }}>No similar destinations found.</p>}
      </div>
    </ModalShell>
  )
}

/* ── Share card modal ── */
function ShareCardModal({ destination: dest, imageUrl, onClose }: { destination: Destination; imageUrl: string | null; onClose: () => void }) {
  const theme = dest.culturalTheme

  async function handleCopy() {
    const text = `✈️ ${dest.city}, ${dest.country} — ${dest.tagline} | Discovered on Wander`
    await navigator.clipboard.writeText(text).catch(() => null)
    toast('Copied to clipboard')
  }

  async function handleNativeShare() {
    const text = `✈️ ${dest.city}, ${dest.country} — ${dest.tagline} | Discovered on Wander`
    await navigator.share({ title: dest.city, text }).catch(() => null)
  }

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center p-6"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <div className="absolute inset-0" style={{ backgroundColor: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)' }} />
      <motion.div
        className="relative z-10 flex flex-col items-center gap-4"
        initial={{ scale: 0.88, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
        transition={{ type: 'spring', damping: 22, stiffness: 300 }}
        onClick={e => e.stopPropagation()}
      >
        {/* The poster card */}
        <div className="rounded-3xl overflow-hidden relative"
          style={{ width: 320, height: 480, background: `linear-gradient(160deg, ${theme.primary}, ${theme.accent} 120%)` }}>
          {imageUrl && (
            <img src={imageUrl} alt={dest.city} className="absolute inset-0 w-full h-full object-cover"
              style={{ filter: 'brightness(0.6) saturate(1.3)', mixBlendMode: 'luminosity' }} />
          )}
          <div className="absolute inset-0" style={{ background: `linear-gradient(to top, ${theme.primary}ee 0%, ${theme.primary}88 40%, transparent 100%)` }} />
          <div className="absolute top-5 right-5 text-4xl">{dest.emoji}</div>
          <div className="absolute bottom-0 left-0 right-0 p-8">
            <p className="text-xs tracking-widest uppercase mb-2" style={{ color: 'rgba(255,255,255,0.6)' }}>Discovered on Wander</p>
            <h2 className="text-5xl text-white leading-none mb-1" style={{ fontFamily: 'var(--font-playfair)' }}>{dest.city}</h2>
            <p className="text-sm mb-3" style={{ color: 'rgba(255,255,255,0.75)' }}>{dest.country} · {dest.region}</p>
            <p className="text-sm italic leading-snug" style={{ color: 'rgba(255,255,255,0.85)' }}>{dest.tagline}</p>
            <div className="flex flex-wrap gap-1.5 mt-4">
              {dest.bestFor.slice(0, 3).map(b => (
                <span key={b} className="text-xs px-2.5 py-1 rounded-full" style={{ backgroundColor: 'rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(4px)' }}>{b}</span>
              ))}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button onClick={handleCopy}
            className="flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium"
            style={{ backgroundColor: 'rgba(255,255,255,0.15)', color: '#fff', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.2)' }}>
            Copy text
          </button>
          {'share' in navigator && (
            <button onClick={handleNativeShare}
              className="flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium"
              style={{ backgroundColor: theme.accent, color: theme.background }}>
              Share <Share2 size={13} />
            </button>
          )}
        </div>
        <p className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>Screenshot the card to save it</p>
      </motion.div>
    </motion.div>
  )
}

/* ── Item detail modal ── */
function ItemModal({ item, city, accent, onClose }: { item: string; city: string; accent: string; onClose: () => void }) {
  const key = `${item}::${city}`
  const [data, setData] = useState<{ image?: string; description?: string } | null>(
    itemInfoCache.get(key) ?? null
  )
  const [loading, setLoading] = useState(!itemInfoCache.has(key))

  useEffect(() => {
    const k = `${item}::${city}`
    if (itemInfoCache.has(k)) {
      setData(itemInfoCache.get(k)!)
      setLoading(false)
      return
    }
    setLoading(true)
    setData(null)
    fetch(`/api/item-info?name=${encodeURIComponent(item)}&context=${encodeURIComponent(city)}`)
      .then(r => r.json())
      .then((d: { image?: string; description?: string }) => {
        itemInfoCache.set(k, d)
        setData(d)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [item, city])

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center p-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0" style={{ backgroundColor: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)' }} />

      {/* Card */}
      <motion.div
        className="relative rounded-3xl overflow-hidden flex flex-col z-10"
        style={{
          width: '100%',
          maxWidth: 520,
          maxHeight: '80vh',
          backgroundColor: 'var(--color-card-bg)',
          border: `1px solid color-mix(in srgb, ${accent} 30%, transparent)`,
          boxShadow: `0 0 60px color-mix(in srgb, ${accent} 25%, transparent), 0 24px 48px rgba(0,0,0,0.5)`,
        }}
        initial={{ scale: 0.82, y: 24, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        exit={{ scale: 0.9, y: 16, opacity: 0 }}
        transition={{ type: 'spring', damping: 22, stiffness: 320 }}
        onClick={e => e.stopPropagation()}
      >
        {/* Image */}
        <div className="relative flex-shrink-0 overflow-hidden" style={{ height: 220 }}>
          {data?.image && !loading ? (
            <img src={data.image} alt={item} className="w-full h-full object-cover"
              style={{ filter: 'brightness(0.88) saturate(1.15)' }} />
          ) : (
            <div className="w-full h-full flex items-center justify-center"
              style={{ background: `linear-gradient(135deg, color-mix(in srgb, ${accent} 30%, #000), color-mix(in srgb, ${accent} 60%, #000))` }}>
              {loading && <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin"
                style={{ borderColor: accent, borderTopColor: 'transparent' }} />}
            </div>
          )}
          <div className="absolute inset-0"
            style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.65) 0%, transparent 60%)' }} />
          <div className="absolute bottom-0 left-0 right-0 px-6 pb-4">
            <h3 className="text-2xl text-white leading-tight"
              style={{ fontFamily: 'var(--font-playfair)', textShadow: '0 2px 8px rgba(0,0,0,0.6)' }}>
              {item}
            </h3>
          </div>
          <button onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center"
            style={{ backgroundColor: 'rgba(0,0,0,0.5)', color: 'white' }}>
            <X size={14} />
          </button>
        </div>

        {/* Body */}
        {(loading || data !== null) && (
          <div className="overflow-y-auto px-6 py-5">
            {loading ? (
              <div className="flex gap-2 items-center" style={{ color: 'var(--color-subtle)' }}>
                <div className="w-4 h-4 rounded-full border-2 border-t-transparent animate-spin"
                  style={{ borderColor: accent, borderTopColor: 'transparent' }} />
                <span className="text-xs">Loading…</span>
              </div>
            ) : data?.description ? (
              <p className="text-sm leading-relaxed" style={{ color: 'var(--color-text)' }}>
                {data.description}
              </p>
            ) : (
              <p className="text-sm italic" style={{ color: 'var(--color-subtle)' }}>
                No information available.
              </p>
            )}
          </div>
        )}
      </motion.div>
    </motion.div>
  )
}

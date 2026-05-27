'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { RefreshCw, ArrowRight, ArrowLeft, Utensils, Landmark, Compass, Calendar, X } from 'lucide-react'
import { Navbar } from '@/components/Navbar'
import { WorldMap } from '@/components/WorldMap'
import { CustomizationPanel } from '@/components/CustomizationPanel'
import type { Destination, AppSettings } from '@/types'

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

interface WikiSummary {
  thumbnail?: { source: string }
  originalimage?: { source: string }
}

const wikiImageCache = new Map<string, string>()

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

function useWikiImage(city: string) {
  const [src, setSrc] = useState<string | null>(wikiImageCache.get(city) ?? null)
  useEffect(() => {
    if (wikiImageCache.has(city)) {
      setSrc(wikiImageCache.get(city)!)
      return
    }
    fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(city)}`)
      .then((r) => r.json())
      .then((d: WikiSummary) => {
        const url = d.originalimage?.source ?? d.thumbnail?.source ?? null
        if (url) wikiImageCache.set(city, url)
        setSrc(url)
      })
      .catch(() => null)
  }, [city])
  return src
}

type View = 'split' | 'detail'

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
  const [cardsSettled, setCardsSettled] = useState(false)

  useEffect(() => {
    const raw = sessionStorage.getItem('wander_destinations')
    if (!raw) { router.push('/discover'); return }
    try {
      setDestinations(JSON.parse(raw) as Destination[])
      setLoading(false)
      setTimeout(() => setCardsSettled(true), 1800)
    } catch {
      setError(true)
      setLoading(false)
    }
  }, [router])

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

  const handleCardClick = useCallback((index: number) => {
    setSelectedIndex(index)
    setView('detail')
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
                    Finding your perfect destinations...
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
                className="flex-shrink-0 flex gap-4 p-4"
                style={{
                  backdropFilter: 'blur(20px) saturate(1.4)',
                  WebkitBackdropFilter: 'blur(20px) saturate(1.4)',
                  backgroundColor: 'color-mix(in srgb, var(--color-bg) 65%, transparent)',
                  borderTop: '1px solid color-mix(in srgb, var(--color-text) 8%, transparent)',
                }}
              >
                {destinations.map((dest, i) => (
                  <BottomCard
                    key={dest.city}
                    destination={dest}
                    isHovered={hoveredIndex === i}
                    isSelected={selectedIndex === i}
                    anyHovered={hoveredIndex !== null}
                    settled={cardsSettled}
                    onHover={() => setHoveredIndex(i)}
                    onLeave={() => setHoveredIndex(null)}
                    onClick={() => handleCardClick(i)}
                  />
                ))}
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
              onExplore={() => handleNavigate(destinations[selectedIndex])}
              onBack={() => setView('split')}
            />
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
  isHovered,
  isSelected,
  anyHovered,
  settled,
  onHover,
  onLeave,
  onClick,
}: {
  destination: Destination
  isHovered: boolean
  isSelected: boolean
  anyHovered: boolean
  settled: boolean
  onHover: () => void
  onLeave: () => void
  onClick: () => void
}) {
  const imageUrl = useWikiImage(dest.city)
  const theme = dest.culturalTheme
  const active = isHovered || isSelected
  const imageVivid = !settled || isHovered || (isSelected && !anyHovered)

  return (
    <motion.div
      className="flex-1 relative rounded-2xl overflow-hidden cursor-pointer"
      style={{
        height: 180,
        border: `1px solid ${active
          ? `color-mix(in srgb, ${theme.accent} 60%, transparent)`
          : 'color-mix(in srgb, var(--color-text) 10%, transparent)'}`,
        transition: 'border-color 0.3s ease',
      }}
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
      onClick={onClick}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.2 }}
    >
      {/* Background image */}
      {imageUrl ? (
        <img src={imageUrl} alt={dest.city} className="absolute inset-0 w-full h-full object-cover"
          style={{ filter: imageVivid ? 'brightness(0.85) saturate(1.3) contrast(1.05)' : 'brightness(0.28) saturate(0.4)', transition: 'filter 0.4s ease' }} />
      ) : (
        <div className="absolute inset-0"
          style={{ background: `linear-gradient(135deg, ${theme.primary}, ${theme.accent})`, opacity: 0.7 }} />
      )}

      {/* Gradient overlay */}
      <div className="absolute inset-0"
        style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.82) 0%, rgba(0,0,0,0.5) 40%, transparent 70%)' }} />


      {/* Content */}
      <div className="absolute inset-0 flex flex-col justify-end p-4"
        style={{ textShadow: '0 1px 6px rgba(0,0,0,0.7)' }}>
        <h3 className="text-xl leading-tight mb-0.5 font-semibold"
          style={{ fontFamily: 'var(--font-playfair)', color: '#ffffff' }}>
          {dest.city}
        </h3>
        <p className="text-xs mb-2 flex items-center gap-1.5" style={{ color: 'rgba(255,255,255,0.88)' }}>
          <Flag code={dest.countryCode} size={16} /> {dest.country}
        </p>

        <motion.p
          className="text-xs italic line-clamp-1 mb-3 font-medium"
          style={{ color: theme.accent, filter: 'brightness(1.2) saturate(1.3)', textShadow: '0 1px 4px rgba(0,0,0,0.8)' }}
          animate={{ opacity: active ? 1 : 0, y: active ? 0 : 4 }}
          transition={{ duration: 0.2 }}
        >
          {dest.tagline}
        </motion.p>

        <button
          className="flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold"
          style={{
            backgroundColor: active ? theme.accent : 'rgba(255,255,255,0.18)',
            color: active ? theme.background : '#ffffff',
            transition: 'background-color 0.3s ease, color 0.3s ease',
          }}
          onClick={(e) => { e.stopPropagation(); onClick() }}
        >
          View details <ArrowRight size={11} />
        </button>
      </div>
    </motion.div>
  )
}

/* ── Full detail card (used in detail view) ── */
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
  const [activeItem, setActiveItem] = useState<string | null>(null)

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
          {imageUrl ? (
            <img src={imageUrl} alt={dest.city} className="w-full h-full object-cover"
              style={{ filter: 'brightness(0.9) saturate(1.2) contrast(1.05)' }} />
          ) : (
            <div className="w-full h-full"
              style={{ background: `linear-gradient(135deg, ${theme.primary}, ${theme.accent})` }} />
          )}
          <div className="absolute inset-0"
            style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.1) 50%, transparent 100%)' }} />
          <div className="absolute bottom-0 left-0 right-0 px-8 pb-6">
            <h2 className="text-5xl md:text-6xl leading-none text-white mb-1"
              style={{ fontFamily: 'var(--font-playfair)', textShadow: '0 2px 12px rgba(0,0,0,0.6)' }}>
              {dest.emoji} {dest.city}
            </h2>
            <p className="text-sm flex items-center gap-2" style={{ color: 'rgba(255,255,255,0.9)', textShadow: '0 1px 6px rgba(0,0,0,0.6)' }}>
              <Flag code={dest.countryCode} size={20} /> {dest.country} · {dest.region}
            </p>
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
          </AnimatePresence>

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
        initial={{ scale: 0.92, y: 20, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        exit={{ scale: 0.92, y: 20, opacity: 0 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
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
        {(loading || data?.description) && (
          <div className="overflow-y-auto px-6 py-5">
            {loading ? (
              <div className="flex gap-2 items-center" style={{ color: 'var(--color-subtle)' }}>
                <div className="w-4 h-4 rounded-full border-2 border-t-transparent animate-spin"
                  style={{ borderColor: accent, borderTopColor: 'transparent' }} />
                <span className="text-xs">Loading...</span>
              </div>
            ) : (
              <p className="text-sm leading-relaxed" style={{ color: 'var(--color-text)' }}>
                {data?.description}
              </p>
            )}
          </div>
        )}
      </motion.div>
    </motion.div>
  )
}

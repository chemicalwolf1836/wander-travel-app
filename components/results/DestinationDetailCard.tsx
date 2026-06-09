'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowRight, ArrowLeft, Utensils, Landmark, Compass, Calendar, Heart, Share2, Luggage, Map as MapIcon, Sparkles, Wallet } from 'lucide-react'
import { isFavourite, toggleFavourite } from '@/lib/favourites'
import { useDestinationImage } from '@/lib/useDestinationImage'
import { prefetchItem } from '@/lib/itemInfoCache'
import { DestImage } from '@/components/DestImage'
import { Flag } from './Flag'
import { ItemChip, ExperienceChip } from './Chips'
import { ItemModal } from './ItemModal'
import { PackingModal } from './PackingModal'
import { ItineraryModal } from './ItineraryModal'
import { BudgetModal } from './BudgetModal'
import { SimilarModal } from './SimilarModal'
import { ShareCardModal } from './ShareCardModal'
import type { Destination, WeatherData } from '@/types'

const WEATHER_EMOJI: Record<string, string> = {
  Clear: '☀️', Clouds: '⛅', Rain: '🌧️', Drizzle: '🌦️',
  Snow: '❄️', Thunderstorm: '⛈️', Mist: '🌫️', Fog: '🌫️', Haze: '🌫️',
}

/* ── Full detail card (used in detail view) ── */
export function DestinationDetailCard({
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
  const [showBudget, setShowBudget] = useState(false)
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

          <div className="absolute bottom-0 left-0 right-0 px-5 sm:px-8 pb-6">
            <h2 className="text-4xl sm:text-5xl md:text-6xl leading-none text-white mb-1"
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
        <div className="overflow-y-auto flex-1 px-5 sm:px-8 py-6">
          <p className="text-base italic leading-relaxed mb-3 font-medium"
            style={{ color: theme.accent, filter: 'brightness(1.15) saturate(1.2)' }}>
            {dest.tagline}
          </p>
          <p className="text-sm leading-relaxed mb-6" style={{ color: 'var(--color-text)' }}>
            {dest.description}
          </p>

          {/* Divider */}
          <div className="mb-6" style={{ height: 1, backgroundColor: 'color-mix(in srgb, var(--color-text) 8%, transparent)' }} />

          {/* See + Eat — stack on mobile, two columns from sm up */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8 mb-6">
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
            {showBudget && (
              <BudgetModal destination={dest} accent={theme.accent} onClose={() => setShowBudget(false)} />
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
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
            {[
              { icon: <Luggage size={13} />, label: 'Packing list', action: () => setShowPacking(true) },
              { icon: <MapIcon size={13} />, label: 'Itinerary', action: () => setShowItinerary(true) },
              { icon: <Wallet size={13} />, label: 'Budget', action: () => setShowBudget(true) },
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

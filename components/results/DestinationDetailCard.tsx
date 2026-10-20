'use client'

import { useState, type CSSProperties } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowRight, ArrowLeft, Calendar, CalendarCheck, Heart, Share2, Luggage,
  Map as MapIcon, Sparkles, Wallet, Tag, ShieldCheck, Coins, Languages, Thermometer,
  Sun, Cloud, CloudRain, CloudDrizzle, Snowflake, CloudLightning, CloudFog, type LucideIcon,
} from 'lucide-react'
import { isFavourite, toggleFavourite } from '@/lib/favourites'
import { useDestinationImage } from '@/lib/useDestinationImage'
import { prefetchItem } from '@/lib/itemInfoCache'
import { DestImage } from '@/components/DestImage'
import { Flag } from './Flag'
import { readableOn, textOn } from '@/lib/contrast'
import { useSurfaceColor } from '@/lib/useSurfaceColor'
import { ItemChip, ExperienceChip } from './Chips'
import { ItemModal } from './ItemModal'
import { PackingModal } from './PackingModal'
import { ItineraryModal } from './ItineraryModal'
import { BudgetModal } from './BudgetModal'
import { SimilarModal } from './SimilarModal'
import { ShareCardModal } from './ShareCardModal'
import { PricesModal } from './PricesModal'
import { VisaModal } from './VisaModal'
import type { Destination, WeatherData } from '@/types'

const WEATHER_ICON: Record<string, LucideIcon> = {
  Clear: Sun, Clouds: Cloud, Rain: CloudRain, Drizzle: CloudDrizzle,
  Snow: Snowflake, Thunderstorm: CloudLightning, Mist: CloudFog, Fog: CloudFog, Haze: CloudFog,
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
  // Accent text has to read on the card surface in both light and dark mode,
  // with headroom for the accent-tinted chip backgrounds.
  const surface = useSurfaceColor()
  const accentText = readableOn(theme.accent, surface, 5.2)
  const [activeItem, setActiveItem] = useState<string | null>(null)
  const [fav, setFav] = useState(() => isFavourite(dest.city))
  const [showPacking, setShowPacking] = useState(false)
  const [showItinerary, setShowItinerary] = useState(false)
  const [showBudget, setShowBudget] = useState(false)
  const [showSimilar, setShowSimilar] = useState(false)
  const [showShareCard, setShowShareCard] = useState(false)
  const [showPrices, setShowPrices] = useState(false)
  const [showVisa, setShowVisa] = useState(false)

  function handleFav() {
    const next = toggleFavourite(dest)
    setFav(next)
  }

  async function handleShare() {
    setShowShareCard(true)
  }

  const weatherIcon = weather ? (WEATHER_ICON[weather.condition] ?? Thermometer) : Thermometer
  const stats = [
    weather && { icon: weatherIcon, label: 'Now', value: `${weather.temp}°C, ${weather.description}` },
    dest.monthFit && { icon: CalendarCheck, label: 'Your month', value: dest.monthFit },
    dest.bestSeasons?.length && { icon: Calendar, label: 'Best time', value: dest.bestSeasons.join(', ') },
  ].filter(Boolean) as { icon: LucideIcon; label: string; value: string }[]
  const facts = [
    dest.currency && { icon: Coins, label: 'Currency', value: dest.currency },
    dest.language && { icon: Languages, label: 'Language', value: dest.language },
    dest.visaInfo && { icon: ShieldCheck, label: 'Entry', value: dest.visaInfo },
  ].filter(Boolean) as { icon: LucideIcon; label: string; value: string }[]
  const tools = [
    { icon: Luggage, label: 'Packing', action: () => setShowPacking(true) },
    { icon: MapIcon, label: 'Itinerary', action: () => setShowItinerary(true) },
    { icon: Wallet, label: 'Budget', action: () => setShowBudget(true) },
    { icon: Tag, label: 'Prices', action: () => setShowPrices(true) },
    { icon: ShieldCheck, label: 'Visa', action: () => setShowVisa(true) },
    { icon: Sparkles, label: 'Similar', action: () => setShowSimilar(true) },
  ]
  const sectionLabel = 'text-[13px] font-medium mb-3'
  const heroButton = 'w-11 h-11 rounded-full flex items-center justify-center'

  return (
    <motion.div className="w-full my-auto"
      style={{ maxWidth: 1180, fontFamily: 'var(--font-outfit), sans-serif' }}
      initial={{ scale: 0.96, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.4, delay: 0.05, ease: 'easeOut' }}>

      {/* Split screen: tall photo beside the details; stacks on phones */}
      <div className="rounded-[26px] overflow-hidden flex flex-col md:flex-row md:h-[min(calc(100vh-136px),780px)]"
        style={{
          backgroundColor: 'var(--color-card-bg)',
          border: `1px solid color-mix(in srgb, ${theme.accent} 22%, transparent)`,
          boxShadow: `0 0 80px color-mix(in srgb, ${theme.accent} 18%, transparent), 0 32px 64px rgba(0,0,0,0.3)`,
        }}>

        {/* Photo */}
        <div className="relative flex-shrink-0 overflow-hidden h-[300px] sm:h-[380px] md:h-auto md:w-[46%]">
          {image?.src ? (
            <DestImage src={image.src} thumb={image.thumb} alt={dest.city}
              filter="brightness(0.9) saturate(1.2) contrast(1.05)" eager />
          ) : (
            <div className="w-full h-full"
              style={{ background: `linear-gradient(135deg, ${theme.primary}, ${theme.accent})` }} />
          )}
          <div className="absolute inset-0"
            style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.3) 45%, rgba(0,0,0,0.15) 100%)' }} />

          <div className="absolute top-4 left-4 right-4 flex justify-between gap-2">
            <motion.button onClick={onBack} whileTap={{ scale: 0.9 }}
              className={heroButton}
              style={{ backgroundColor: 'rgba(0,0,0,0.55)', color: 'white' }}
              aria-label="Back to destinations" title="Back to destinations">
              <ArrowLeft size={18} />
            </motion.button>
            <div className="flex gap-2">
              <motion.button onClick={handleShare} whileTap={{ scale: 0.9 }}
                className={heroButton}
                style={{ backgroundColor: 'rgba(0,0,0,0.55)', color: 'white' }}
                aria-label={`Share ${dest.city}`} title="Share destination">
                <Share2 size={18} />
              </motion.button>
              <motion.button onClick={handleFav} whileTap={{ scale: 0.9 }}
                className={heroButton}
                style={{ backgroundColor: 'rgba(0,0,0,0.55)', color: 'white' }}
                aria-label={fav ? `Remove ${dest.city} from saved` : `Save ${dest.city}`}
                aria-pressed={fav}
                title={fav ? 'Remove from saved' : 'Save destination'}>
                <Heart size={18} fill={fav ? 'currentColor' : 'none'} />
              </motion.button>
            </div>
          </div>

          <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-8">
            <h2 className="text-6xl sm:text-7xl md:text-8xl leading-[0.92] text-white mb-3 font-extralight"
              style={{ fontFamily: 'var(--font-outfit), sans-serif', letterSpacing: '-0.03em', textShadow: '0 2px 12px rgba(0,0,0,0.45)' }}>
              {dest.city}
            </h2>
            <p className="text-base flex items-center gap-2" style={{ color: 'rgba(255,255,255,0.92)', textShadow: '0 1px 6px rgba(0,0,0,0.6)' }}>
              <Flag code={dest.countryCode} size={20} /> {dest.country} · {dest.region}
            </p>
          </div>
        </div>

        {/* Details */}
        <div className="flex-1 min-w-0 flex flex-col md:min-h-0">
        <div className="flex-1 md:overflow-y-auto px-5 sm:px-8 py-6 sm:py-8 flex flex-col gap-7">
          <div>
            <p className="text-xl leading-snug mb-2" style={{ color: accentText }}>
              {dest.tagline}
            </p>
            <p className="text-[15px] leading-relaxed font-light" style={{ color: 'var(--color-text)' }}>
              {dest.description}
            </p>
          </div>

          {stats.length > 0 && (
            <div className="grid gap-2.5" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))' }}>
              {stats.map(({ icon: Icon, label, value }) => (
                <div key={label} className="rounded-2xl px-4 py-3.5 flex flex-col gap-1"
                  style={{ backgroundColor: 'color-mix(in srgb, var(--color-text) 6%, transparent)' }}>
                  <span className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--color-subtle)' }}>
                    <Icon size={14} style={{ color: accentText }} aria-hidden="true" />{label}
                  </span>
                  <span className="text-[15px] leading-snug" style={{ color: 'var(--color-text)' }}>{value}</span>
                </div>
              ))}
            </div>
          )}

          <div>
            <div className={sectionLabel} style={{ color: 'var(--color-subtle)' }}>Plan</div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {tools.map(({ icon: Icon, label, action }) => (
                <button key={label} onClick={action}
                  className="mono-tile min-h-[56px] flex items-center gap-2.5 pl-2 pr-3 rounded-[14px] text-sm text-left"
                  style={{ '--icon': accentText } as CSSProperties}>
                  <span className="mono-icon w-10 h-10 flex-shrink-0 rounded-[10px] flex items-center justify-center">
                    <Icon size={18} strokeWidth={1.75} aria-hidden="true" />
                  </span>
                  {label}
                </button>
              ))}
            </div>
          </div>

          {dest.attractions.length > 0 && (
            <div>
              <div className={sectionLabel} style={{ color: 'var(--color-subtle)' }}>See</div>
              <div className="flex flex-wrap gap-1.5">
                {dest.attractions.slice(0, 5).map((a) => (
                  <ItemChip key={a} label={a} onClick={() => setActiveItem(a)} onPrefetch={() => prefetchItem(a, dest.city)} />
                ))}
              </div>
            </div>
          )}

          {dest.food.dishes.length > 0 && (
            <div>
              <div className={sectionLabel} style={{ color: 'var(--color-subtle)' }}>Eat</div>
              {dest.food.summary && (
                <p className="text-sm font-light leading-snug -mt-1 mb-3" style={{ color: 'var(--color-subtle)' }}>
                  {dest.food.summary}
                </p>
              )}
              <div className="flex flex-wrap gap-1.5">
                {dest.food.dishes.slice(0, 5).map((d) => (
                  <ItemChip key={d} label={d} onClick={() => setActiveItem(d)} onPrefetch={() => prefetchItem(d, dest.city)} />
                ))}
              </div>
            </div>
          )}

          {dest.bestFor.length > 0 && (
            <div>
              <div className={sectionLabel} style={{ color: 'var(--color-subtle)' }}>Best for</div>
              <div className="flex flex-wrap gap-1.5">
                {dest.bestFor.slice(0, 6).map((b) => (
                  <ExperienceChip key={b} label={b} onClick={() => setActiveItem(b)} onPrefetch={() => prefetchItem(b, dest.city)} />
                ))}
              </div>
            </div>
          )}

          {facts.length > 0 && (
            <div className="flex flex-col gap-2">
              {facts.map(({ icon: Icon, label, value }) => (
                <div key={label} className="flex items-start gap-2.5 text-sm font-light" style={{ color: 'var(--color-text)' }}>
                  <Icon size={16} strokeWidth={1.75} className="mt-0.5 flex-shrink-0" style={{ color: accentText }} aria-hidden="true" />
                  <span><span style={{ color: 'var(--color-subtle)' }}>{label}</span> {value}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Explore stays in view while the details scroll */}
        <div className="px-5 sm:px-8 py-4 flex-shrink-0"
          style={{ borderTop: '1px solid color-mix(in srgb, var(--color-text) 8%, transparent)' }}>
          <button onClick={onExplore}
            className="mono-cta w-full flex items-center justify-between gap-2 min-h-[56px] px-6 rounded-[14px] text-base font-medium"
            style={{ backgroundColor: theme.accent, color: textOn(theme.accent) }}>
            Explore {dest.city} <ArrowRight size={18} />
          </button>
        </div>
        </div>
      </div>

      <AnimatePresence>
        {activeItem && (
          <ItemModal item={activeItem} city={dest.city} accent={accentText} onClose={() => setActiveItem(null)} />
        )}
        {showPacking && (
          <PackingModal destination={dest} accent={accentText} onClose={() => setShowPacking(false)} />
        )}
        {showItinerary && (
          <ItineraryModal destination={dest} accent={accentText} onClose={() => setShowItinerary(false)} />
        )}
        {showBudget && (
          <BudgetModal destination={dest} accent={accentText} onClose={() => setShowBudget(false)} />
        )}
        {showSimilar && (
          <SimilarModal destination={dest} accent={accentText} onClose={() => setShowSimilar(false)} />
        )}
        {showPrices && (
          <PricesModal destination={dest} accent={accentText} onClose={() => setShowPrices(false)} />
        )}
        {showVisa && (
          <VisaModal destination={dest} accent={accentText} onClose={() => setShowVisa(false)} />
        )}
        {showShareCard && (
          <ShareCardModal destination={dest} imageUrl={imageUrl} onClose={() => setShowShareCard(false)} />
        )}
      </AnimatePresence>
    </motion.div>
  )
}

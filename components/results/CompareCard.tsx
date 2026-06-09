'use client'

import { ArrowRight } from 'lucide-react'
import { useDestinationImage } from '@/lib/useDestinationImage'
import { DestImage } from '@/components/DestImage'
import type { Destination, WeatherData } from '@/types'

/* ── Compare card ── */
export function CompareCard({ destination: dest, weather, onExplore }: { destination: Destination; weather: WeatherData | null; onExplore: () => void }) {
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

'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { MapPin } from 'lucide-react'
import { WeatherBadge } from './WeatherBadge'
import { TagChip } from './TagChip'
import { DishChip } from './DishChip'
import { AttractionBadge } from './AttractionBadge'
import type { Destination, WeatherData } from '@/types'

interface DestinationCardProps {
  destination: Destination
  index: number
  isActive: boolean
  onHover: () => void
  onClick: () => void
}

export function DestinationCard({
  destination,
  index,
  isActive,
  onHover,
  onClick,
}: DestinationCardProps) {
  const [weather, setWeather] = useState<WeatherData | null>(null)

  // Fetch live weather on mount
  useEffect(() => {
    fetch(`/api/weather?city=${encodeURIComponent(destination.city)}&country=${destination.countryCode}`)
      .then((r) => r.json())
      .then((data: WeatherData | null) => { if (data) setWeather(data) })
      .catch(() => null)
  }, [destination.city, destination.countryCode])

  const theme = destination.culturalTheme

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.15 }}
      whileHover={{ y: -8 }}
      onHoverStart={onHover}
      onClick={onClick}
      className="relative rounded-2xl p-6 cursor-pointer overflow-hidden"
      style={{
        backgroundColor: theme.cardBg,
        border: `1px solid ${isActive ? theme.primary : 'color-mix(in srgb, ' + theme.primary + ' 30%, transparent)'}`,
        boxShadow: isActive
          ? `0 0 40px color-mix(in srgb, ${theme.accent} 35%, transparent), 0 8px 32px rgba(0,0,0,0.3)`
          : `0 4px 20px rgba(0,0,0,0.2)`,
        transition: 'box-shadow 600ms ease-in-out, border-color 600ms ease-in-out',
      }}
    >
      {/* Subtle accent glow at top */}
      <div
        className="absolute top-0 left-0 right-0 h-px"
        style={{ background: `linear-gradient(90deg, transparent, ${theme.accent}, transparent)` }}
      />

      {/* Header */}
      <div className="mb-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <h2
            className="text-3xl leading-tight"
            style={{ fontFamily: 'var(--font-playfair)', color: theme.text }}
          >
            {destination.emoji} {destination.city}
          </h2>
        </div>

        {/* Country badge */}
        <div
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs mb-3"
          style={{
            backgroundColor: `color-mix(in srgb, ${theme.primary} 20%, transparent)`,
            color: theme.text,
            border: `1px solid color-mix(in srgb, ${theme.primary} 40%, transparent)`,
          }}
        >
          <MapPin size={10} />
          {destination.flagEmoji} {destination.country}
        </div>

        {/* Weather */}
        {weather && <WeatherBadge weather={weather} />}
      </div>

      {/* Tagline */}
      <p
        className="text-sm italic mb-3 leading-relaxed"
        style={{ color: theme.accent }}
      >
        {destination.tagline}
      </p>

      {/* Description */}
      <p
        className="text-sm leading-relaxed mb-4 line-clamp-3"
        style={{ color: `color-mix(in srgb, ${theme.text} 80%, transparent)` }}
      >
        {destination.description}
      </p>

      {/* Food */}
      {destination.food.dishes.length > 0 && (
        <div className="mb-4">
          <p className="text-xs uppercase tracking-widest mb-2" style={{ color: theme.accent }}>
            Food
          </p>
          <p className="text-xs mb-2" style={{ color: `color-mix(in srgb, ${theme.text} 70%, transparent)` }}>
            {destination.food.summary}
          </p>
          <div className="flex flex-wrap gap-1.5">
            {destination.food.dishes.slice(0, 4).map((dish) => (
              <DishChip key={dish} name={dish} />
            ))}
          </div>
        </div>
      )}

      {/* Attractions */}
      {destination.attractions.length > 0 && (
        <div className="mb-4">
          <p className="text-xs uppercase tracking-widest mb-2" style={{ color: theme.accent }}>
            Top Attractions
          </p>
          <div className="space-y-1">
            {destination.attractions.slice(0, 3).map((a) => (
              <AttractionBadge key={a} name={a} />
            ))}
          </div>
        </div>
      )}

      {/* Best For tags */}
      {destination.bestFor.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {destination.bestFor.slice(0, 4).map((tag) => (
            <TagChip key={tag} label={tag} />
          ))}
        </div>
      )}
    </motion.div>
  )
}

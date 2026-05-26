'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { X, GripHorizontal } from 'lucide-react'
import { WeatherBadge } from './WeatherBadge'
import { DishChip } from './DishChip'
import { TagChip } from './TagChip'
import { AttractionBadge } from './AttractionBadge'
import type { Destination, WeatherData } from '@/types'

interface DetailPanelProps {
  destination: Destination
  onBack: () => void
}

export function DetailPanel({ destination, onBack }: DetailPanelProps) {
  const [weather, setWeather] = useState<WeatherData | null>(null)

  useEffect(() => {
    fetch(`/api/weather?city=${encodeURIComponent(destination.city)}&country=${destination.countryCode}`)
      .then((r) => r.json())
      .then((data: WeatherData | null) => { if (data) setWeather(data) })
      .catch(() => null)
  }, [destination.city, destination.countryCode])

  return (
    <motion.div
      className="fixed bottom-0 left-0 right-0 z-50 rounded-t-3xl overflow-y-auto"
      style={{
        height: '80vh',
        backgroundColor: 'var(--color-card-bg)',
        borderTop: '1px solid color-mix(in srgb, var(--color-primary) 30%, transparent)',
        boxShadow: '0 -20px 60px rgba(0,0,0,0.4)',
      }}
      initial={{ y: '100%' }}
      animate={{ y: 0 }}
      exit={{ y: '100%' }}
      transition={{ type: 'spring', damping: 28, stiffness: 300 }}
      drag="y"
      dragConstraints={{ top: 0, bottom: 0 }}
      dragElastic={{ top: 0, bottom: 0.3 }}
    >
      {/* Drag handle */}
      <div className="flex justify-center pt-3 pb-1">
        <GripHorizontal size={20} style={{ color: 'var(--color-subtle)' }} />
      </div>

      <div className="px-6 pb-12 max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1
              className="text-4xl mb-1"
              style={{ fontFamily: 'var(--font-playfair)', color: 'var(--color-text)' }}
            >
              {destination.emoji} {destination.city}
            </h1>
            <p style={{ color: 'var(--color-subtle)' }}>
              {destination.flagEmoji} {destination.country} - {destination.region}
            </p>
          </div>
          <button
            onClick={onBack}
            className="p-2 rounded-full hover:opacity-70 transition-opacity"
            style={{ color: 'var(--color-subtle)' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Weather */}
        {weather && (
          <div className="mb-6">
            <WeatherBadge weather={weather} />
          </div>
        )}

        {/* Description */}
        <p className="text-base leading-relaxed mb-6" style={{ color: 'var(--color-text)' }}>
          {destination.description}
        </p>

        {/* Food section */}
        {destination.food.dishes.length > 0 && (
          <div className="mb-6">
            <h3
              className="text-lg mb-2"
              style={{ fontFamily: 'var(--font-playfair)', color: 'var(--color-text)' }}
            >
              Food Culture
            </h3>
            <p className="text-sm mb-3" style={{ color: 'var(--color-subtle)' }}>
              {destination.food.summary}
            </p>
            <div className="flex flex-wrap gap-2">
              {destination.food.dishes.map((dish) => (
                <DishChip key={dish} name={dish} />
              ))}
            </div>
          </div>
        )}

        {/* Attractions */}
        {destination.attractions.length > 0 && (
          <div className="mb-6">
            <h3
              className="text-lg mb-3"
              style={{ fontFamily: 'var(--font-playfair)', color: 'var(--color-text)' }}
            >
              Top Attractions
            </h3>
            <div className="space-y-1">
              {destination.attractions.map((a) => (
                <AttractionBadge key={a} name={a} />
              ))}
            </div>
          </div>
        )}

        {/* Best For tags */}
        {destination.bestFor.length > 0 && (
          <div className="mb-6">
            <h3
              className="text-lg mb-3"
              style={{ fontFamily: 'var(--font-playfair)', color: 'var(--color-text)' }}
            >
              Best For
            </h3>
            <div className="flex flex-wrap gap-2">
              {destination.bestFor.map((tag) => (
                <TagChip key={tag} label={tag} />
              ))}
            </div>
          </div>
        )}

        {/* Back button */}
        <button
          onClick={onBack}
          className="w-full py-3 rounded-full text-sm font-medium mt-4"
          style={{
            backgroundColor: 'var(--color-accent)',
            color: 'var(--color-bg)',
          }}
        >
          Back to Destinations
        </button>
      </div>
    </motion.div>
  )
}

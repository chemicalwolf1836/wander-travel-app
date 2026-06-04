'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { X, GripHorizontal } from 'lucide-react'
import { WeatherBadge } from './WeatherBadge'
import { DishChip } from './DishChip'
import { TagChip } from './TagChip'
import { AttractionBadge } from './AttractionBadge'
import { useDestinationImage } from '@/lib/useDestinationImage'
import type { Destination, WeatherData } from '@/types'

interface DetailPanelProps {
  destination: Destination
  onBack: () => void
}

export function DetailPanel({ destination, onBack }: DetailPanelProps) {
  const [weather, setWeather] = useState<WeatherData | null>(null)
  const image = useDestinationImage(destination.city, destination.country)

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
      {/* Hero image band — city title overlaid */}
      <div
        className="relative w-full"
        style={{ height: 208, borderTopLeftRadius: 24, borderTopRightRadius: 24, overflow: 'hidden' }}
      >
        {image?.src ? (
          <img
            src={image.src}
            alt={destination.city}
            className="absolute inset-0 w-full h-full object-cover"
            style={{ filter: 'brightness(0.9) saturate(1.15)' }}
          />
        ) : (
          <div
            className="absolute inset-0"
            style={{ background: 'linear-gradient(135deg, var(--color-primary), var(--color-accent))' }}
          />
        )}
        {/* Dark scrim — keeps the white title legible in both themes */}
        <div
          className="absolute inset-0"
          style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.1) 55%, rgba(0,0,0,0.25) 100%)' }}
        />

        {/* Drag handle (over image) */}
        <div className="absolute top-2 left-0 right-0 flex justify-center">
          <GripHorizontal size={20} style={{ color: 'rgba(255,255,255,0.85)' }} />
        </div>

        {/* Close */}
        <button
          onClick={onBack}
          className="absolute top-3 right-3 p-2 rounded-full hover:opacity-100 transition-opacity"
          style={{ backgroundColor: 'rgba(0,0,0,0.4)', color: '#fff', opacity: 0.85 }}
        >
          <X size={18} />
        </button>

        {/* Unsplash attribution */}
        {image?.credit && (
          <a
            href={`${image.credit.link}?utm_source=wander&utm_medium=referral`}
            target="_blank"
            rel="noreferrer"
            className="absolute top-3 left-3 text-[10px] px-2 py-0.5 rounded-full opacity-70 hover:opacity-100 transition-opacity"
            style={{ backgroundColor: 'rgba(0,0,0,0.4)', color: '#fff' }}
            title={`Photo by ${image.credit.name} on Unsplash`}
          >
            📷 {image.credit.name}
          </a>
        )}

        {/* Title overlay */}
        <div className="absolute bottom-0 left-0 right-0 px-6 pb-4">
          <div className="max-w-2xl mx-auto" style={{ textShadow: '0 2px 12px rgba(0,0,0,0.6)' }}>
            <h1 className="text-4xl mb-0.5" style={{ fontFamily: 'var(--font-playfair)', color: '#fff' }}>
              {destination.emoji} {destination.city}
            </h1>
            <p style={{ color: 'rgba(255,255,255,0.9)' }}>
              {destination.flagEmoji} {destination.country} - {destination.region}
            </p>
          </div>
        </div>
      </div>

      <div className="px-6 pb-12 max-w-2xl mx-auto pt-6">
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

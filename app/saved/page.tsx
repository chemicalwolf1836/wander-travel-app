'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Heart, MapPin, ArrowRight } from 'lucide-react'
import { Navbar } from '@/components/Navbar'
import { getFavourites, toggleFavourite } from '@/lib/favourites'
import type { Destination } from '@/types'

export default function SavedPage() {
  const router = useRouter()
  const [favourites, setFavourites] = useState<Destination[]>([])
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setFavourites(getFavourites())
    setMounted(true)
  }, [])

  function handleRemove(dest: Destination) {
    toggleFavourite(dest)
    setFavourites(getFavourites())
  }

  function handleExplore(dest: Destination) {
    sessionStorage.setItem('wander_destinations', JSON.stringify([dest]))
    router.push('/results')
  }

  if (!mounted) return null

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: 'var(--color-bg)' }}>
      <Navbar />

      <main className="flex-1 max-w-3xl mx-auto w-full px-6 pt-28 pb-16">
        <div className="flex items-center gap-3 mb-8">
          <Heart size={22} style={{ color: 'var(--color-accent)' }} />
          <h1
            className="text-3xl"
            style={{ fontFamily: 'var(--font-playfair)', color: 'var(--color-text)' }}
          >
            Saved
          </h1>
          {favourites.length > 0 && (
            <span
              className="text-sm ml-1"
              style={{ color: 'var(--color-subtle)' }}
            >
              {favourites.length} destination{favourites.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>

        {favourites.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex flex-col items-center justify-center py-24 text-center"
          >
            <Heart size={40} className="mb-4 opacity-20" style={{ color: 'var(--color-text)' }} />
            <p className="text-lg mb-2" style={{ color: 'var(--color-text)' }}>Nothing saved yet</p>
            <p className="text-sm mb-6" style={{ color: 'var(--color-subtle)' }}>
              Tap the heart on any destination to save it here.
            </p>
            <button
              onClick={() => router.push('/discover')}
              className="px-6 py-3 rounded-full text-sm font-medium transition-all hover:scale-105"
              style={{
                backgroundColor: 'var(--color-accent)',
                color: 'var(--color-bg)',
              }}
            >
              Start exploring
            </button>
          </motion.div>
        ) : (
          <motion.div
            className="flex flex-col gap-3"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4 }}
          >
            <AnimatePresence>
              {favourites.map((dest, i) => (
                <motion.div
                  key={dest.city}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -20, height: 0, marginBottom: 0 }}
                  transition={{ duration: 0.25, delay: i * 0.06 }}
                  className="flex items-center gap-4 rounded-2xl p-4"
                  style={{
                    backgroundColor: 'var(--color-card-bg)',
                    border: '1px solid color-mix(in srgb, var(--color-primary) 15%, transparent)',
                  }}
                >
                  <span className="text-3xl leading-none">{dest.flagEmoji}</span>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span
                        className="font-semibold text-base truncate"
                        style={{ color: 'var(--color-text)' }}
                      >
                        {dest.city}
                      </span>
                      <span style={{ color: 'var(--color-subtle)' }}>·</span>
                      <span className="text-sm truncate" style={{ color: 'var(--color-subtle)' }}>
                        {dest.country}
                      </span>
                    </div>
                    {dest.tagline && (
                      <p className="text-xs mt-0.5 truncate" style={{ color: 'var(--color-subtle)' }}>
                        {dest.tagline}
                      </p>
                    )}
                    {dest.region && (
                      <div className="flex items-center gap-1 mt-1">
                        <MapPin size={10} style={{ color: 'var(--color-subtle)' }} />
                        <span className="text-xs" style={{ color: 'var(--color-subtle)' }}>
                          {dest.region}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => handleExplore(dest)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all hover:scale-105"
                      style={{
                        backgroundColor: 'color-mix(in srgb, var(--color-accent) 12%, transparent)',
                        color: 'var(--color-accent)',
                        border: '1px solid color-mix(in srgb, var(--color-accent) 25%, transparent)',
                      }}
                    >
                      Explore
                      <ArrowRight size={11} />
                    </button>

                    <button
                      onClick={() => handleRemove(dest)}
                      className="p-2 rounded-full transition-all hover:scale-110"
                      style={{ color: 'var(--color-accent)' }}
                      aria-label={`Remove ${dest.city} from saved`}
                    >
                      <Heart size={16} fill="currentColor" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </main>
    </div>
  )
}

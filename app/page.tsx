'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import { Navbar } from '@/components/Navbar'
import type { Preferences } from '@/types'

const FLOATING_DESTINATIONS = [
  'Paris', 'Kyoto', 'Marrakech', 'Santorini', 'Reykjavik',
  'Havana', 'Bali', 'Lisbon', 'Cartagena', 'Cape Town',
  'Tokyo', 'Dubrovnik', 'Petra', 'Maldives',
]

interface FloatingName {
  name: string
  x: number
  y: number
  duration: number
  delay: number
}

export default function HomePage() {
  const router = useRouter()
  const [floatingNames, setFloatingNames] = useState<FloatingName[]>([])
  const [surpriseLoading, setSurpriseLoading] = useState(false)
  const [loadingCity, setLoadingCity] = useState('')
  const [exiting, setExiting] = useState(false)

  useEffect(() => {
    setFloatingNames(
      FLOATING_DESTINATIONS.map((name) => ({
        name,
        x: Math.random() * 80 + 5,
        y: Math.random() * 80 + 5,
        duration: 18 + Math.random() * 14,
        delay: Math.random() * 6,
      }))
    )
  }, [])

  // Cycle through destination names while the Surprise Me call is in flight
  useEffect(() => {
    if (!surpriseLoading) { setLoadingCity(''); return }
    let i = Math.floor(Math.random() * FLOATING_DESTINATIONS.length)
    setLoadingCity(FLOATING_DESTINATIONS[i])
    const id = setInterval(() => {
      i = (i + 1) % FLOATING_DESTINATIONS.length
      setLoadingCity(FLOATING_DESTINATIONS[i])
    }, 900)
    return () => clearInterval(id)
  }, [surpriseLoading])

  async function handleSurpriseMe(city?: string) {
    setSurpriseLoading(true)
    try {
      const preferences: Preferences = {
        summary: city
          ? `Surprise me with destinations similar to or near ${city}, open to anything`
          : 'Surprise me — anywhere in the world, any vibe, any budget',
        climate: 'any',
        budget: 'any',
        travelStyle: 'adventurous, open-minded',
        foodPreferences: 'anything',
        other: city ? `inspired by ${city}` : 'completely open',
      }
      const res = await fetch('/api/suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ preferences }),
      })
      if (!res.ok) {
        setSurpriseLoading(false)
        toast.error("Couldn't find destinations right now — try again in a moment.")
        return
      }
      const suggestions: unknown = await res.json()
      sessionStorage.setItem('wander_destinations', JSON.stringify(suggestions))
      setExiting(true)
      await new Promise(r => setTimeout(r, 350))
      router.push('/results')
    } catch {
      setSurpriseLoading(false)
      toast.error('Something went wrong. Please check your connection and try again.')
    }
  }

  async function handleStartJourney() {
    setExiting(true)
    await new Promise(r => setTimeout(r, 350))
    router.push('/discover')
  }

  return (
    <motion.div
      animate={{ opacity: exiting ? 0 : 1 }}
      transition={{ duration: 0.35, ease: 'easeInOut' }}
      className="relative min-h-screen flex flex-col overflow-hidden"
      style={{ backgroundColor: 'var(--color-bg)' }}
    >
      <Navbar />

      {/* Animated gradient mesh background */}
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute inset-0 opacity-30"
          style={{
            background: `
              radial-gradient(ellipse 80% 60% at 20% 30%, color-mix(in srgb, var(--color-primary) 40%, transparent), transparent),
              radial-gradient(ellipse 60% 80% at 80% 70%, color-mix(in srgb, var(--color-accent) 20%, transparent), transparent)
            `,
          }}
        />
        <div
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: `linear-gradient(var(--color-text) 1px, transparent 1px), linear-gradient(90deg, var(--color-text) 1px, transparent 1px)`,
            backgroundSize: '60px 60px',
          }}
        />
      </div>

      {/* Floating destination names */}
      {floatingNames.map((item) => (
        <motion.button
          key={item.name}
          onClick={() => handleSurpriseMe(item.name)}
          className="absolute font-bold whitespace-nowrap cursor-pointer select-none"
          style={{
            fontFamily: 'var(--font-playfair)',
            left: `${item.x}%`,
            top: `${item.y}%`,
            color: 'var(--color-text)',
            fontSize: 'clamp(1rem, 3vw, 2.5rem)',
          }}
          animate={{ y: [0, -18, 0], x: [0, 10, 0], opacity: [0.14, 0.18, 0.14] }}
          transition={{ duration: item.duration, delay: item.delay, repeat: Infinity, ease: 'easeInOut' }}
          whileHover={{ opacity: 0.7, scale: 1.08 }}
          title={`Surprise me with ${item.name}`}
        >
          {item.name}
        </motion.button>
      ))}

      {/* Main content */}
      <main className="relative z-10 flex flex-col items-center justify-center flex-1 px-6 text-center pt-24">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="max-w-3xl"
        >
          <h1
            className="text-5xl md:text-7xl lg:text-8xl mb-6 leading-tight"
            style={{ fontFamily: 'var(--font-playfair)', color: 'var(--color-text)' }}
          >
            Where do you want to go?
          </h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: 'easeOut' }}
            className="text-lg md:text-xl mb-10 leading-relaxed max-w-lg mx-auto"
            style={{ color: 'var(--color-subtle)' }}
          >
            Tell us what you are dreaming of. We will find your perfect destination.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4, ease: 'easeOut' }}
            className="flex flex-col sm:flex-row items-center justify-center gap-3"
          >
            <button
              onClick={handleStartJourney}
              className="inline-flex items-center gap-2 px-8 py-4 rounded-full text-base font-medium transition-all hover:scale-105"
              style={{
                backgroundColor: 'var(--color-accent)',
                color: 'var(--color-bg)',
                boxShadow: `0 0 40px color-mix(in srgb, var(--color-accent) 40%, transparent)`,
              }}
            >
              Start Your Journey
            </button>

            <button
              onClick={() => handleSurpriseMe()}
              disabled={surpriseLoading}
              className="inline-flex items-center gap-2 px-8 py-4 rounded-full text-base font-medium transition-all hover:scale-105 disabled:opacity-60"
              style={{
                backgroundColor: 'color-mix(in srgb, var(--color-text) 8%, transparent)',
                color: 'var(--color-text)',
                border: '1px solid color-mix(in srgb, var(--color-text) 15%, transparent)',
              }}
            >
              {surpriseLoading ? (
                <span className="flex items-center gap-2">
                  <span
                    className="w-4 h-4 rounded-full border-2 animate-spin inline-block"
                    style={{ borderColor: 'var(--color-text)', borderTopColor: 'transparent' }}
                  />
                  Finding...
                </span>
              ) : '✦ Surprise me'}
            </button>
          </motion.div>

          {/* Cycling city hint while Surprise Me is loading */}
          <div className="mt-6 h-6">
            <AnimatePresence mode="wait">
              {surpriseLoading && loadingCity && (
                <motion.p
                  key={loadingCity}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.35 }}
                  className="text-sm tracking-widest uppercase"
                  style={{ color: 'var(--color-subtle)' }}
                >
                  Exploring {loadingCity}…
                </motion.p>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </main>
    </motion.div>
  )
}

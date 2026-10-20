'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from 'framer-motion'
import { toast } from 'sonner'
import { ArrowRight, Sparkles } from 'lucide-react'
import { Navbar } from '@/components/Navbar'
import { getRecentlyViewed } from '@/lib/recentlyViewed'
import type { Preferences, Destination } from '@/types'

const FLOATING_DESTINATIONS = [
  'Paris', 'Kyoto', 'Marrakech', 'Santorini', 'Reykjavik',
  'Havana', 'Bali', 'Lisbon', 'Cartagena', 'Cape Town',
  'Tokyo', 'Dubrovnik', 'Petra', 'Maldives',
]

interface FloatingName {
  name: string
  side: 'left' | 'right'
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
  const [recent, setRecent] = useState<Destination[]>([])

  // Aurora mouse parallax
  const rawMouseX = useMotionValue(0.5)
  const rawMouseY = useMotionValue(0.5)
  const mouseX = useSpring(rawMouseX, { stiffness: 40, damping: 25 })
  const mouseY = useSpring(rawMouseY, { stiffness: 40, damping: 25 })
  const auroraX = useTransform(mouseX, [0, 1], ['-2%', '2%'])
  const auroraY = useTransform(mouseY, [0, 1], ['-1.5%', '1.5%'])

  function handleMouseMove(e: React.MouseEvent) {
    rawMouseX.set(e.clientX / window.innerWidth)
    rawMouseY.set(e.clientY / window.innerHeight)
  }

  useEffect(() => {
    setRecent(getRecentlyViewed())
  }, [])

  useEffect(() => {
    setFloatingNames(
      // Alternate names between the left and right margins, spread down the
      // page, so they never drift behind the headline or buttons.
      FLOATING_DESTINATIONS.map((name, i) => ({
        name,
        side: i % 2 === 0 ? 'left' : 'right',
        x: 1 + Math.random() * 5,
        y: 14 + (Math.floor(i / 2) / Math.ceil(FLOATING_DESTINATIONS.length / 2)) * 76 + Math.random() * 5,
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
      sessionStorage.setItem('wander_preferences', JSON.stringify(preferences))
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

  async function openRecent(dest: Destination) {
    // Re-seed the detail page's expected sessionStorage entry, then navigate.
    sessionStorage.setItem(`wander_dest_${dest.city}`, JSON.stringify(dest))
    setExiting(true)
    await new Promise(r => setTimeout(r, 350))
    router.push(`/destination/${encodeURIComponent(dest.city)}`)
  }

  return (
    <motion.div
      animate={{ opacity: exiting ? 0 : 1 }}
      transition={{ duration: 0.35, ease: 'easeInOut' }}
      className="relative min-h-screen flex flex-col overflow-hidden"
      style={{ backgroundColor: 'var(--color-bg)' }}
      onMouseMove={handleMouseMove}
    >
      <Navbar />

      {/* Aurora background */}
      <motion.div className="absolute inset-0 pointer-events-none" style={{ x: auroraX, y: auroraY }}>
        {/* Orb 1 — accent, top-left drift */}
        <motion.div
          className="absolute"
          style={{
            width: 600, height: 600, borderRadius: '50%', top: '-10%', left: '-5%',
            background: 'radial-gradient(circle, var(--color-accent) 0%, transparent 70%)',
            filter: 'blur(80px)', opacity: 0.18,
          }}
          animate={{ x: [0, '13%', 0], y: [0, '12%', 0] }}
          transition={{ duration: 28, repeat: Infinity, ease: 'easeInOut' }}
        />
        {/* Orb 2 — primary, bottom-right drift */}
        <motion.div
          className="absolute"
          style={{
            width: 500, height: 500, borderRadius: '50%', bottom: '-5%', right: '-5%',
            background: 'radial-gradient(circle, var(--color-primary) 0%, transparent 70%)',
            filter: 'blur(100px)', opacity: 0.28,
          }}
          animate={{ x: [0, '-12%', 0], y: [0, '-10%', 0] }}
          transition={{ duration: 22, repeat: Infinity, ease: 'easeInOut', delay: 4 }}
        />
        {/* Orb 3 — accent tint, center */}
        <motion.div
          className="absolute"
          style={{
            width: 400, height: 400, borderRadius: '50%', top: '40%', left: '35%',
            background: 'radial-gradient(circle, var(--color-accent) 0%, transparent 70%)',
            filter: 'blur(90px)', opacity: 0.10,
          }}
          animate={{ x: [0, '10%', 0], y: [0, '15%', 0] }}
          transition={{ duration: 35, repeat: Infinity, ease: 'easeInOut', delay: 10 }}
        />
        {/* Grid texture */}
        <div
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: `linear-gradient(var(--color-text) 1px, transparent 1px), linear-gradient(90deg, var(--color-text) 1px, transparent 1px)`,
            backgroundSize: '60px 60px',
          }}
        />
      </motion.div>

      {/* Floating destination names */}
      {floatingNames.map((item) => (
        <motion.button
          key={item.name}
          onClick={() => handleSurpriseMe(item.name)}
          className="absolute hidden xl:block font-extralight whitespace-nowrap cursor-pointer select-none"
          tabIndex={-1}
          aria-hidden="true"
          style={{
            fontFamily: 'var(--font-outfit)',
            [item.side]: `${item.x}%`,
            top: `${item.y}%`,
            color: 'var(--color-text)',
            fontSize: 'clamp(1rem, 3vw, 2.5rem)',
          }}
          animate={{ y: [0, -18, 0], x: [0, 10, 0], opacity: [0.22, 0.32, 0.22] }}
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
            style={{ fontFamily: 'var(--font-outfit)', color: 'var(--color-text)' }}
          >
            Where do you want to go?
          </h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: 'easeOut' }}
            className="text-lg md:text-xl mb-8 leading-relaxed max-w-lg mx-auto"
            style={{ color: 'var(--color-text)', opacity: 0.85 }}
          >
            Tell us what you're dreaming of — we'll find your perfect destination.
          </motion.p>

          {/* Accent bar */}
          <motion.div
            initial={{ opacity: 0, scaleX: 0 }}
            animate={{ opacity: 1, scaleX: 1 }}
            transition={{ duration: 0.7, delay: 0.3, ease: 'easeOut' }}
            className="mx-auto mb-8"
            style={{
              width: 40,
              height: 2,
              borderRadius: 1,
              background: 'var(--color-accent)',
            }}
          />

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.35, ease: 'easeOut' }}
          >
            <div className="flex flex-col items-stretch gap-3 w-full max-w-sm mx-auto">
              <button
                onClick={handleStartJourney}
                className="mono-cta inline-flex items-center justify-center gap-2 w-full min-h-14 px-7 rounded-[14px] text-base font-medium"
                style={{ backgroundColor: 'var(--color-accent)', color: 'var(--color-on-accent)' }}
              >
                Start your journey <ArrowRight size={16} aria-hidden="true" />
              </button>

              <button
                onClick={() => handleSurpriseMe()}
                disabled={surpriseLoading}
                aria-busy={surpriseLoading}
                className="mono-tile inline-flex items-center justify-center gap-2 w-full min-h-14 px-6 rounded-[14px] text-base disabled:opacity-60"
              >
                {surpriseLoading ? (
                  <span className="flex items-center gap-2">
                    <span
                      className="w-4 h-4 rounded-full border-2 animate-spin inline-block"
                      style={{ borderColor: 'var(--color-text)', borderTopColor: 'transparent' }}
                    />
                    Finding…
                  </span>
                ) : <><Sparkles size={16} aria-hidden="true" /> Surprise me</>}
              </button>
            </div>
          </motion.div>

          {/* Stat line */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.55, ease: 'easeOut' }}
            className="mt-5 text-[13px] font-medium"
            style={{ color: 'var(--color-subtle)' }}
          >
            Worldwide destinations · AI-powered discovery
          </motion.p>

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
                  aria-live="polite"
                >
                  Exploring {loadingCity}…
                </motion.p>
              )}
            </AnimatePresence>
          </div>

          {/* Recently viewed — quick return to destinations you've opened */}
          {recent.length > 0 && !surpriseLoading && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6, ease: 'easeOut' }}
              className="mt-10"
            >
              <p className="text-[13px] font-medium mb-3" style={{ color: 'var(--color-subtle)' }}>
                Recently viewed
              </p>
              <div className="flex flex-wrap items-center justify-center gap-2">
                {recent.map((d) => (
                  <motion.button
                    key={d.city}
                    onClick={() => openRecent(d)}
                    className="mono-chip inline-flex items-center gap-1.5 min-h-10 px-4 rounded-xl text-sm"
                  >
                    <span>{d.flagEmoji}</span> {d.city}
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}
        </motion.div>
      </main>
    </motion.div>
  )
}

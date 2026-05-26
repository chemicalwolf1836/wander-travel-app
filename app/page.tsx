'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Navbar } from '@/components/Navbar'

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
  // Generate positions client-side only to avoid server/browser mismatch
  const [floatingNames, setFloatingNames] = useState<FloatingName[]>([])

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

  return (
    <div
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
        {/* Subtle grid overlay */}
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
        <motion.span
          key={item.name}
          className="absolute select-none pointer-events-none font-bold whitespace-nowrap"
          style={{
            fontFamily: 'var(--font-playfair)',
            left: `${item.x}%`,
            top: `${item.y}%`,
            color: 'var(--color-text)',
            fontSize: 'clamp(1rem, 3vw, 2.5rem)',
            opacity: 0.04,
          }}
          animate={{
            y: [0, -18, 0],
            x: [0, 10, 0],
          }}
          transition={{
            duration: item.duration,
            delay: item.delay,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        >
          {item.name}
        </motion.span>
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
            className="text-lg md:text-xl mb-12 leading-relaxed max-w-lg mx-auto"
            style={{ color: 'var(--color-subtle)' }}
          >
            Tell us what you are dreaming of. We will find your perfect destination.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4, ease: 'easeOut' }}
          >
            <Link
              href="/discover"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-full text-base font-medium transition-all hover:scale-105 hover:shadow-2xl"
              style={{
                backgroundColor: 'var(--color-accent)',
                color: 'var(--color-bg)',
                boxShadow: `0 0 40px color-mix(in srgb, var(--color-accent) 40%, transparent)`,
              }}
            >
              Start Your Journey
            </Link>
          </motion.div>
        </motion.div>
      </main>
    </div>
  )
}

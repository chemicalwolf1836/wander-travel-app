'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Heart, MapPin, ArrowRight, Compass, StickyNote, ChevronDown, CalendarDays } from 'lucide-react'
import { toast } from 'sonner'
import { Navbar } from '@/components/Navbar'
import { getFavourites, toggleFavourite } from '@/lib/favourites'
import { getNote, saveNote } from '@/lib/tripNotes'
import { getTripDate, saveTripDate, countdownLabel } from '@/lib/tripDates'
import { useDestinationImage } from '@/lib/useDestinationImage'
import { DestImage } from '@/components/DestImage'
import type { Destination, Preferences } from '@/types'

export default function SavedPage() {
  const router = useRouter()
  const [favourites, setFavourites] = useState<Destination[]>([])
  const [mounted, setMounted] = useState(false)
  const [exploringCity, setExploringCity] = useState<string | null>(null)
  const [hasResults, setHasResults] = useState(false)
  const [pendingRemoveCity, setPendingRemoveCity] = useState<string | null>(null)
  const undoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    setFavourites(getFavourites())
    setHasResults(!!sessionStorage.getItem('wander_destinations'))
    setMounted(true)
  }, [])

  function handleRemove(dest: Destination) {
    if (undoTimerRef.current) clearTimeout(undoTimerRef.current)
    setPendingRemoveCity(dest.city)

    undoTimerRef.current = setTimeout(() => {
      toggleFavourite(dest)
      setFavourites(getFavourites())
      setPendingRemoveCity(null)
    }, 3500)

    toast(`${dest.city} removed`, {
      action: {
        label: 'Undo',
        onClick: () => {
          clearTimeout(undoTimerRef.current!)
          setPendingRemoveCity(null)
        },
      },
    })
  }

  async function handleExplore(dest: Destination) {
    setExploringCity(dest.city)
    toast(`Finding destinations similar to ${dest.city}…`)
    try {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 55000)
      const preferences: Preferences = {
        summary: `Surprise me with destinations similar to or near ${dest.city}, open to anything`,
        climate: 'any',
        budget: 'any',
        travelStyle: 'adventurous, open-minded',
        foodPreferences: 'anything',
        other: `inspired by ${dest.city}`,
      }
      const res = await fetch('/api/suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ preferences }),
        signal: controller.signal,
      })
      clearTimeout(timeout)
      if (!res.ok) {
        toast.error("Couldn't load destinations — try again in a moment.")
        setExploringCity(null)
        return
      }
      const suggestions: unknown = await res.json()
      sessionStorage.setItem('wander_destinations', JSON.stringify(suggestions))
      router.push('/results')
    } catch {
      toast.error('Something went wrong. Please check your connection.')
      setExploringCity(null)
    }
  }

  if (!mounted) return null

  const displayed = favourites.filter(d => d.city !== pendingRemoveCity)

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: 'var(--color-bg)' }}>
      <Navbar />

      <main className="flex-1 max-w-2xl mx-auto w-full px-6 pt-24 pb-16">

        {/* Header row */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <Heart size={20} style={{ color: 'var(--color-accent)' }} />
            <h1
              className="text-3xl"
              style={{ fontFamily: 'var(--font-playfair)', color: 'var(--color-text)' }}
            >
              Saved
            </h1>
            {displayed.length > 0 && (
              <span
                className="text-xs px-2 py-0.5 rounded-full"
                style={{
                  backgroundColor: 'color-mix(in srgb, var(--color-accent) 12%, transparent)',
                  color: 'var(--color-accent)',
                  border: '1px solid color-mix(in srgb, var(--color-accent) 25%, transparent)',
                }}
              >
                {displayed.length}
              </span>
            )}
          </div>

          {hasResults && (
            <motion.button
              onClick={() => router.push('/results')}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full transition-opacity hover:opacity-80"
              style={{
                color: 'var(--color-subtle)',
                border: '1px solid color-mix(in srgb, var(--color-text) 12%, transparent)',
              }}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
            >
              <ArrowRight size={11} className="rotate-180" />
              Back to destinations
            </motion.button>
          )}
        </div>

        {/* Divider */}
        <div
          className="mb-8"
          style={{ height: 1, backgroundColor: 'color-mix(in srgb, var(--color-text) 8%, transparent)' }}
        />

        {/* Empty state */}
        {displayed.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex flex-col items-center justify-center py-24 text-center"
          >
            <div className="relative mb-6">
              <div
                className="absolute inset-0 rounded-full blur-2xl opacity-20"
                style={{ backgroundColor: 'var(--color-accent)', transform: 'scale(1.8)' }}
              />
              <Heart size={44} style={{ color: 'var(--color-accent)', opacity: 0.35, position: 'relative' }} />
            </div>
            <p
              className="text-2xl mb-2"
              style={{ fontFamily: 'var(--font-playfair)', color: 'var(--color-text)' }}
            >
              Nothing saved yet
            </p>
            <p className="text-sm mb-8 max-w-xs leading-relaxed" style={{ color: 'var(--color-subtle)' }}>
              Tap the heart on any destination to save it here.
            </p>
            <button
              onClick={() => router.push('/discover')}
              className="px-6 py-3 rounded-full text-sm font-medium transition-all hover:scale-105"
              style={{
                backgroundColor: 'var(--color-accent)',
                color: 'var(--color-bg)',
                boxShadow: '0 0 24px color-mix(in srgb, var(--color-accent) 35%, transparent)',
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
              {displayed.map((dest, i) => (
                <motion.div
                  key={dest.city}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -30, height: 0, marginBottom: 0 }}
                  transition={{ duration: 0.25, delay: i * 0.05 }}
                  className="flex items-center gap-4 rounded-2xl px-5 py-4"
                  style={{
                    backgroundColor: 'var(--color-card-bg)',
                    border: '1px solid color-mix(in srgb, var(--color-primary) 15%, transparent)',
                  }}
                >
                  {/* Photo thumbnail (Unsplash/Wikipedia, flag fallback) */}
                  <SavedThumb dest={dest} />

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-1.5 mb-0.5">
                      <span className="font-semibold text-base" style={{ color: 'var(--color-text)' }}>
                        {dest.city}
                      </span>
                      <span className="text-xs" style={{ color: 'var(--color-subtle)' }}>
                        · {dest.country}
                      </span>
                    </div>
                    {dest.tagline && (
                      <p className="text-xs truncate mb-1" style={{ color: 'var(--color-accent)', opacity: 0.85 }}>
                        {dest.tagline}
                      </p>
                    )}
                    {dest.region && (
                      <div className="flex items-center gap-1">
                        <MapPin size={9} style={{ color: 'var(--color-subtle)' }} />
                        <span className="text-xs" style={{ color: 'var(--color-subtle)' }}>
                          {dest.region}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <motion.button
                      onClick={() => handleExplore(dest)}
                      disabled={exploringCity !== null}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium disabled:opacity-50"
                      style={{
                        backgroundColor: 'color-mix(in srgb, var(--color-accent) 12%, transparent)',
                        color: 'var(--color-accent)',
                        border: '1px solid color-mix(in srgb, var(--color-accent) 25%, transparent)',
                      }}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.97 }}
                    >
                      {exploringCity === dest.city ? (
                        <>
                          <span
                            className="w-3 h-3 rounded-full border border-t-transparent animate-spin inline-block"
                            style={{ borderColor: 'var(--color-accent)', borderTopColor: 'transparent' }}
                          />
                          Finding…
                        </>
                      ) : (
                        <>
                          <Compass size={11} />
                          Explore
                        </>
                      )}
                    </motion.button>

                    <DateButton city={dest.city} />

                    <NoteButton city={dest.city} />

                    <motion.button
                      onClick={() => handleRemove(dest)}
                      className="p-2 rounded-full"
                      style={{ color: 'var(--color-accent)' }}
                      aria-label={`Remove ${dest.city} from saved`}
                      whileHover={{ scale: 1.15 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      <Heart size={15} fill="currentColor" />
                    </motion.button>
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

function SavedThumb({ dest }: { dest: Destination }) {
  const image = useDestinationImage(dest.city, dest.country)
  const theme = dest.culturalTheme
  return (
    <div
      className="relative w-16 h-16 rounded-xl overflow-hidden flex-shrink-0"
      style={{ border: `1px solid color-mix(in srgb, ${theme.accent} 25%, transparent)` }}
    >
      {image?.src ? (
        <DestImage
          src={image.thumb}
          thumb={image.thumb}
          alt={dest.city}
          filter="brightness(0.95) saturate(1.15)"
        />
      ) : (
        <div
          className="w-full h-full flex items-center justify-center"
          style={{ background: `linear-gradient(135deg, ${theme.primary}, ${theme.accent})` }}
        >
          <span className="text-2xl leading-none">{dest.flagEmoji}</span>
        </div>
      )}
    </div>
  )
}

function DateButton({ city }: { city: string }) {
  const [open, setOpen] = useState(false)
  const [date, setDate] = useState(() => getTripDate(city))
  const label = countdownLabel(date)

  function handleChange(value: string) {
    setDate(value)
    saveTripDate(city, value)
  }

  return (
    <div className="relative flex items-center gap-1.5">
      {label && (
        <span className="text-xs whitespace-nowrap" style={{ color: label === 'Trip passed' ? 'var(--color-subtle)' : 'var(--color-accent)' }}>
          {label}
        </span>
      )}
      <motion.button
        onClick={() => setOpen(o => !o)}
        className="p-2 rounded-full"
        style={{ color: date ? 'var(--color-accent)' : 'var(--color-subtle)' }}
        aria-label={date ? `Trip date set: ${date}` : 'Set trip date'}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        title="Set trip date"
      >
        <CalendarDays size={14} />
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            className="absolute right-0 bottom-10 z-20 rounded-2xl overflow-hidden shadow-2xl"
            style={{
              width: 220,
              backgroundColor: 'var(--color-card-bg)',
              border: '1px solid color-mix(in srgb, var(--color-accent) 20%, transparent)',
              boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
            }}
            initial={{ opacity: 0, scale: 0.9, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 8 }}
            transition={{ type: 'spring', damping: 24, stiffness: 320 }}
          >
            <div className="px-3 pt-3 pb-1 flex items-center justify-between">
              <span className="text-xs font-medium tracking-wide" style={{ color: 'var(--color-subtle)' }}>
                Trip date
              </span>
              <button onClick={() => setOpen(false)} style={{ color: 'var(--color-subtle)' }}>
                <ChevronDown size={12} />
              </button>
            </div>
            <div className="px-3 pb-3 flex items-center gap-2">
              <input
                type="date"
                className="flex-1 text-xs px-2 py-1.5 rounded-lg bg-transparent outline-none"
                style={{ color: 'var(--color-text)', border: '1px solid color-mix(in srgb, var(--color-text) 15%, transparent)' }}
                value={date}
                onChange={e => handleChange(e.target.value)}
                autoFocus
              />
              {date && (
                <button onClick={() => handleChange('')} className="text-xs px-2 py-1" style={{ color: 'var(--color-subtle)' }}>
                  Clear
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function NoteButton({ city }: { city: string }) {
  const [open, setOpen] = useState(false)
  const [text, setText] = useState(() => getNote(city))
  const hasNote = text.trim().length > 0

  function handleBlur() {
    saveNote(city, text)
  }

  return (
    <div className="relative">
      <motion.button
        onClick={() => setOpen(o => !o)}
        className="p-2 rounded-full"
        style={{ color: hasNote ? 'var(--color-accent)' : 'var(--color-subtle)' }}
        aria-label="Trip notes"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        title="Add trip note"
      >
        <StickyNote size={14} fill={hasNote ? 'currentColor' : 'none'} />
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            className="absolute right-0 bottom-10 z-20 rounded-2xl overflow-hidden shadow-2xl"
            style={{
              width: 240,
              backgroundColor: 'var(--color-card-bg)',
              border: '1px solid color-mix(in srgb, var(--color-accent) 20%, transparent)',
              boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
            }}
            initial={{ opacity: 0, scale: 0.9, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 8 }}
            transition={{ type: 'spring', damping: 24, stiffness: 320 }}
          >
            <div className="px-3 pt-3 pb-1 flex items-center justify-between">
              <span className="text-xs font-medium tracking-wide" style={{ color: 'var(--color-subtle)' }}>
                Trip notes
              </span>
              <button onClick={() => setOpen(false)} style={{ color: 'var(--color-subtle)' }}>
                <ChevronDown size={12} />
              </button>
            </div>
            <textarea
              className="w-full resize-none text-xs leading-relaxed px-3 pb-3 bg-transparent outline-none"
              style={{ color: 'var(--color-text)', minHeight: 80 }}
              placeholder="Dates, budget, ideas…"
              value={text}
              onChange={e => setText(e.target.value)}
              onBlur={handleBlur}
              autoFocus
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

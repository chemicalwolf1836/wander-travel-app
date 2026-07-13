'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Printer, Copy, CalendarDays, StickyNote } from 'lucide-react'
import { toast } from 'sonner'
import { Navbar } from '@/components/Navbar'
import { DestImage } from '@/components/DestImage'
import { WeatherBadge } from '@/components/WeatherBadge'
import { useDestinationImage } from '@/lib/useDestinationImage'
import { useWeather } from '@/lib/useWeather'
import { applyTheme, resetTheme } from '@/lib/applyTheme'
import { getFavourites } from '@/lib/favourites'
import { getRecentlyViewed } from '@/lib/recentlyViewed'
import { getTripDate, countdownLabel } from '@/lib/tripDates'
import { getNote } from '@/lib/tripNotes'
import { getTripPlan, type TripPlan } from '@/lib/tripPlan'
import type { Destination } from '@/types'

// Look for the full destination in the places that already store it: saved
// favourites first (a trip is almost always for a saved place), then recently
// viewed, then the per-city sessionStorage the results page writes.
function resolveDestination(city: string): Destination | null {
  const fromFavourites = getFavourites().find(d => d.city === city)
  if (fromFavourites) return fromFavourites
  const fromRecent = getRecentlyViewed().find(d => d.city === city)
  if (fromRecent) return fromRecent
  try {
    const raw = sessionStorage.getItem(`wander_dest_${city}`)
    if (raw) return JSON.parse(raw) as Destination
  } catch { /* ignore */ }
  return null
}

function buildPlanText(city: string, dest: Destination | null, plan: TripPlan, date: string, note: string): string {
  const lines: string[] = [`My ${city} trip${dest ? `, ${dest.country}` : ''}`, '']
  if (date) lines.push(`Dates: ${date} (${countdownLabel(date)})`, '')
  if (note) lines.push(`Notes: ${note}`, '')
  if (plan.itinerary) {
    lines.push(`Itinerary (${plan.itinerary.tripDays} days):`)
    for (const d of plan.itinerary.days) {
      lines.push(`  Day ${d.day} — ${d.title}`)
      lines.push(`    Morning: ${d.morning}`)
      lines.push(`    Afternoon: ${d.afternoon}`)
      lines.push(`    Evening: ${d.evening}`)
      if (d.tip) lines.push(`    Tip: ${d.tip}`)
    }
    lines.push('')
  }
  if (plan.packing) {
    lines.push(`Packing list (${plan.packing.tripDays} days):`)
    for (const cat of plan.packing.categories) {
      lines.push(`  ${cat.name}: ${cat.items.join(', ')}`)
    }
  }
  return lines.join('\n').trim()
}

export function TripView({ city }: { city: string }) {
  const [dest, setDest] = useState<Destination | null>(null)
  const [plan, setPlan] = useState<TripPlan>({})
  const [date, setDate] = useState('')
  const [note, setNote] = useState('')
  const [ready, setReady] = useState(false)

  const image = useDestinationImage(dest?.city ?? '', dest?.country ?? '')
  const weather = useWeather(dest?.city ?? '', dest?.countryCode ?? '')

  useEffect(() => {
    const d = resolveDestination(city)
    setDest(d)
    setPlan(getTripPlan(city))
    setDate(getTripDate(city))
    setNote(getNote(city))
    setReady(true)
  }, [city])

  // Match the app's look by applying the destination's cultural theme while here.
  useEffect(() => {
    if (dest?.culturalTheme) applyTheme(dest.culturalTheme, weather?.condition)
    return () => resetTheme()
  }, [dest, weather?.condition])

  const accent = dest?.culturalTheme?.accent ?? 'var(--color-accent)'

  function handleCopy() {
    const text = buildPlanText(city, dest, plan, date, note)
    navigator.clipboard?.writeText(text).then(
      () => toast.success('Trip plan copied'),
      () => toast.error("Couldn't copy the plan"),
    )
  }

  const hasContent = !!(plan.itinerary || plan.packing || date || note)

  return (
    <main className="min-h-screen" style={{ backgroundColor: 'var(--color-bg)', color: 'var(--color-text)' }}>
      <div className="no-print">
        <Navbar />
      </div>

      <div className="max-w-3xl mx-auto px-5 pt-24 pb-16 trip-print">
        {/* Top actions */}
        <div className="flex items-center justify-between mb-6 no-print">
          <Link href="/saved" className="inline-flex items-center gap-1.5 text-sm" style={{ color: 'var(--color-subtle)' }}>
            <ArrowLeft size={15} /> Saved
          </Link>
          <div className="flex items-center gap-2">
            <button onClick={handleCopy} className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full"
              style={{ backgroundColor: 'color-mix(in srgb, var(--color-text) 8%, transparent)', color: 'var(--color-text)' }}>
              <Copy size={13} /> Copy plan
            </button>
            <button onClick={() => window.print()} className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full"
              style={{ backgroundColor: accent, color: '#fff' }}>
              <Printer size={13} /> Print trip
            </button>
          </div>
        </div>

        {/* Hero */}
        {dest && (
          <div className="relative h-56 sm:h-72 rounded-2xl overflow-hidden mb-6">
            {image?.src && <DestImage src={image.src} thumb={image.thumb} alt={dest.city} eager />}
            <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.65), rgba(0,0,0,0.1))' }} />
            <div className="absolute bottom-0 left-0 right-0 p-5">
              <div className="flex items-center gap-2 mb-1">
                <h1 className="text-3xl text-white" style={{ fontFamily: 'var(--font-playfair)' }}>{dest.city}</h1>
                {weather && <WeatherBadge weather={weather} />}
              </div>
              <p className="text-sm text-white/80">{dest.country}{dest.tagline ? ` · ${dest.tagline}` : ''}</p>
            </div>
          </div>
        )}

        {!dest && (
          <h1 className="text-3xl mb-6" style={{ fontFamily: 'var(--font-playfair)' }}>{city}</h1>
        )}

        {/* Dates + notes */}
        {(date || note) && (
          <section className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
            {date && (
              <div className="p-4 rounded-xl" style={{ backgroundColor: 'var(--color-card-bg)', border: '1px solid color-mix(in srgb, var(--color-text) 8%, transparent)' }}>
                <p className="flex items-center gap-2 text-xs uppercase tracking-widest mb-1" style={{ color: accent }}><CalendarDays size={13} /> Dates</p>
                <p className="text-sm" style={{ color: 'var(--color-text)' }}>{date} · {countdownLabel(date)}</p>
              </div>
            )}
            {note && (
              <div className="p-4 rounded-xl" style={{ backgroundColor: 'var(--color-card-bg)', border: '1px solid color-mix(in srgb, var(--color-text) 8%, transparent)' }}>
                <p className="flex items-center gap-2 text-xs uppercase tracking-widest mb-1" style={{ color: accent }}><StickyNote size={13} /> Notes</p>
                <p className="text-sm whitespace-pre-wrap" style={{ color: 'var(--color-text)' }}>{note}</p>
              </div>
            )}
          </section>
        )}

        {/* Itinerary */}
        {plan.itinerary && (
          <section className="mb-8">
            <h2 className="text-xl mb-4" style={{ fontFamily: 'var(--font-playfair)' }}>Itinerary · {plan.itinerary.tripDays} days</h2>
            <div className="space-y-5">
              {plan.itinerary.days.map(d => (
                <div key={d.day} className="break-inside-avoid">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ backgroundColor: `color-mix(in srgb, ${accent} 15%, transparent)`, color: accent }}>Day {d.day}</span>
                    <p className="text-sm font-semibold">{d.title}</p>
                  </div>
                  {([['Morning', d.morning], ['Afternoon', d.afternoon], ['Evening', d.evening]] as const).map(([label, text]) => (
                    <div key={label} className="flex gap-3 mb-1.5">
                      <span className="text-xs w-16 flex-shrink-0 pt-0.5" style={{ color: 'var(--color-subtle)' }}>{label}</span>
                      <p className="text-xs leading-relaxed">{text}</p>
                    </div>
                  ))}
                  {d.tip && <p className="text-xs italic mt-1.5 pl-1 border-l-2" style={{ color: accent, borderColor: `color-mix(in srgb, ${accent} 40%, transparent)` }}>💡 {d.tip}</p>}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Packing */}
        {plan.packing && (
          <section className="mb-8">
            <h2 className="text-xl mb-4" style={{ fontFamily: 'var(--font-playfair)' }}>Packing list · {plan.packing.tripDays} days</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {plan.packing.categories.map(cat => (
                <div key={cat.name} className="break-inside-avoid">
                  <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: accent }}>{cat.name}</p>
                  <ul className="space-y-1">
                    {cat.items.map(item => (
                      <li key={item} className="flex items-start gap-2 text-xs"><span style={{ color: accent, marginTop: 2 }}>·</span>{item}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Empty state */}
        {ready && !hasContent && (
          <div className="text-center py-16 no-print">
            <p className="text-sm mb-4" style={{ color: 'var(--color-subtle)' }}>
              No trip plan yet for {city}. Open its detail view to add trip dates, notes, an itinerary, or a packing list — they&apos;ll show up here.
            </p>
            <Link href="/saved" className="text-sm underline" style={{ color: accent }}>Back to saved</Link>
          </div>
        )}
      </div>
    </main>
  )
}

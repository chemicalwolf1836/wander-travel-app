'use client'

import { useEffect, useState } from 'react'
import { Map as MapIcon, X } from 'lucide-react'
import { toast } from 'sonner'
import { ModalShell } from './ModalShell'
import type { Destination } from '@/types'

export type ItineraryDay = { day: number; title: string; morning: string; afternoon: string; evening: string; tip: string }

/* ── Itinerary modal ── */
export function ItineraryModal({ destination: dest, accent, onClose }: { destination: Destination; accent: string; onClose: () => void }) {
  const [days, setDays] = useState<ItineraryDay[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [tripDays, setTripDays] = useState(5)

  async function fetchItinerary(n: number) {
    setLoading(true)
    try {
      const res = await fetch('/api/itinerary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ city: dest.city, country: dest.country, attractions: dest.attractions, dishes: dest.food.dishes, bestFor: dest.bestFor, tripDays: n }),
      })
      if (res.ok) setDays(await res.json() as ItineraryDay[])
      else toast.error("Couldn't build an itinerary. Please try again.")
    } catch {
      toast.error("Couldn't build an itinerary. Please try again.")
    }
    setLoading(false)
  }

  useEffect(() => { fetchItinerary(tripDays) }, [])

  return (
    <ModalShell accent={accent} onClose={onClose}>
      <div className="flex items-center justify-between px-6 py-4 border-b flex-shrink-0" style={{ borderColor: 'color-mix(in srgb, var(--color-text) 8%, transparent)' }}>
        <div className="flex items-center gap-2">
          <MapIcon size={16} style={{ color: accent }} />
          <h3 className="text-lg" style={{ fontFamily: 'var(--font-playfair)', color: 'var(--color-text)' }}>{dest.city} itinerary</h3>
        </div>
        <button onClick={onClose} aria-label="Close panel" className="w-7 h-7 rounded-full flex items-center justify-center" style={{ backgroundColor: 'color-mix(in srgb, var(--color-text) 8%, transparent)', color: 'var(--color-subtle)' }}><X size={14} /></button>
      </div>
      <div className="flex items-center gap-2 px-6 py-3 border-b flex-shrink-0" style={{ borderColor: 'color-mix(in srgb, var(--color-text) 6%, transparent)' }}>
        <span className="text-xs" style={{ color: 'var(--color-subtle)' }}>Days:</span>
        {[3, 5, 7, 10].map(d => (
          <button key={d} onClick={() => { setTripDays(d); fetchItinerary(d) }}
            className="text-xs px-2.5 py-1 rounded-full transition-colors"
            style={{ backgroundColor: tripDays === d ? accent : 'color-mix(in srgb, var(--color-text) 8%, transparent)', color: tripDays === d ? '#fff' : 'var(--color-subtle)' }}>{d}</button>
        ))}
      </div>
      <div className="overflow-y-auto flex-1 px-6 py-4 space-y-5">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-6 h-6 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: accent, borderTopColor: 'transparent' }} />
          </div>
        ) : days ? days.map(d => (
          <div key={d.day}>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ backgroundColor: `color-mix(in srgb, ${accent} 15%, transparent)`, color: accent }}>Day {d.day}</span>
              <p className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>{d.title}</p>
            </div>
            {[['Morning', d.morning], ['Afternoon', d.afternoon], ['Evening', d.evening]].map(([label, text]) => (
              <div key={label} className="flex gap-3 mb-1.5">
                <span className="text-xs w-16 flex-shrink-0 pt-0.5" style={{ color: 'var(--color-subtle)' }}>{label}</span>
                <p className="text-xs leading-relaxed" style={{ color: 'var(--color-text)' }}>{text}</p>
              </div>
            ))}
            {d.tip && <p className="text-xs italic mt-1.5 pl-1 border-l-2" style={{ color: accent, borderColor: `color-mix(in srgb, ${accent} 40%, transparent)` }}>💡 {d.tip}</p>}
          </div>
        )) : <p className="text-sm text-center py-8" style={{ color: 'var(--color-subtle)' }}>Failed to load. Try again.</p>}
      </div>
    </ModalShell>
  )
}

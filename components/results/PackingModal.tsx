'use client'

import { useEffect, useState } from 'react'
import { Luggage, X } from 'lucide-react'
import { toast } from 'sonner'
import { ModalShell } from './ModalShell'
import { getTripPlan, savePacking, type PackingCategory } from '@/lib/tripPlan'
import type { Destination } from '@/types'

export type { PackingCategory }

/* ── Packing list modal ── */
export function PackingModal({ destination: dest, accent, onClose }: { destination: Destination; accent: string; onClose: () => void }) {
  const saved = getTripPlan(dest.city).packing
  const [categories, setCategories] = useState<PackingCategory[] | null>(saved?.categories ?? null)
  const [loading, setLoading] = useState(!saved)
  const [tripDays, setTripDays] = useState(saved?.tripDays ?? 7)

  async function fetchPacking(days: number) {
    setLoading(true)
    try {
      const res = await fetch('/api/packing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ city: dest.city, country: dest.country, bestSeasons: dest.bestSeasons, tripDays: days }),
      })
      if (res.ok) {
        const cats = await res.json() as PackingCategory[]
        setCategories(cats)
        savePacking(dest.city, cats, days) // persist so /trip/[city] can show it and reopening is instant
      } else toast.error("Couldn't generate a packing list. Please try again.")
    } catch {
      toast.error("Couldn't generate a packing list. Please try again.")
    }
    setLoading(false)
  }

  // Only generate on open when there's nothing saved for this city yet.
  useEffect(() => { if (!saved) fetchPacking(tripDays) }, [])

  return (
    <ModalShell accent={accent} onClose={onClose}>
      <div className="flex items-center justify-between px-6 py-4 border-b flex-shrink-0" style={{ borderColor: 'color-mix(in srgb, var(--color-text) 8%, transparent)' }}>
        <div className="flex items-center gap-2">
          <Luggage size={16} style={{ color: accent }} />
          <h3 className="text-lg" style={{ fontFamily: 'var(--font-outfit)', color: 'var(--color-text)' }}>Packing list for {dest.city}</h3>
        </div>
        <button onClick={onClose} aria-label="Close panel" className="w-7 h-7 rounded-full flex items-center justify-center" style={{ backgroundColor: 'color-mix(in srgb, var(--color-text) 8%, transparent)', color: 'var(--color-subtle)' }}><X size={14} /></button>
      </div>
      <div className="flex items-center gap-2 px-6 py-3 border-b flex-shrink-0" style={{ borderColor: 'color-mix(in srgb, var(--color-text) 6%, transparent)' }}>
        <span className="text-xs" style={{ color: 'var(--color-subtle)' }}>Trip length:</span>
        {[3, 5, 7, 10, 14].map(d => (
          <button key={d} onClick={() => { setTripDays(d); fetchPacking(d) }}
            className="mono-chip text-xs px-2.5 py-1 rounded-full"
            aria-pressed={tripDays === d}
            style={tripDays === d ? { backgroundColor: 'var(--color-text)', color: 'var(--color-card-bg)' } : undefined}>{d}d</button>
        ))}
      </div>
      <div className="overflow-y-auto flex-1 px-6 py-4">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-6 h-6 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: accent, borderTopColor: 'transparent' }} />
          </div>
        ) : categories ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {categories.map(cat => (
              <div key={cat.name}>
                <p className="text-[13px] font-medium mb-2" style={{ color: accent }}>{cat.name}</p>
                <ul className="space-y-1">
                  {cat.items.map(item => (
                    <li key={item} className="flex items-start gap-2 text-xs" style={{ color: 'var(--color-text)' }}>
                      <span style={{ color: accent, marginTop: 2 }}>·</span>{item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        ) : <p className="text-sm text-center py-8" style={{ color: 'var(--color-subtle)' }}>Failed to load. Try again.</p>}
      </div>
    </ModalShell>
  )
}

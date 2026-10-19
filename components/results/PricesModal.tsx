'use client'

import { useEffect, useState } from 'react'
import { ExternalLink, PlaneTakeoff, Tag, X } from 'lucide-react'
import { ModalShell } from './ModalShell'
import { getHomeCity, saveHomeCity, bookingLinks } from '@/lib/travelProfile'
import type { Destination } from '@/types'
import type { PriceEstimate } from '@/app/api/prices/route'

/* ── Price estimates + booking links ── */
export function PricesModal({ destination: dest, accent, onClose }: { destination: Destination; accent: string; onClose: () => void }) {
  const [from, setFrom] = useState('')
  const [draft, setDraft] = useState('')
  const [estimate, setEstimate] = useState<PriceEstimate | null>(null)
  const [loading, setLoading] = useState(true)
  const [failed, setFailed] = useState(false)

  async function load(origin: string) {
    setLoading(true)
    setFailed(false)
    try {
      const res = await fetch('/api/prices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ city: dest.city, country: dest.country, from: origin }),
      })
      if (!res.ok) throw new Error()
      setEstimate(await res.json() as PriceEstimate)
    } catch {
      setFailed(true)
    }
    setLoading(false)
  }

  useEffect(() => {
    const home = getHomeCity()
    setFrom(home)
    setDraft(home)
    load(home)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function handleFrom(e: React.FormEvent) {
    e.preventDefault()
    const next = draft.trim()
    if (next === from) return
    setFrom(next)
    saveHomeCity(next)
    load(next)
  }

  const line = { borderBottom: '1px solid color-mix(in srgb, var(--color-text) 6%, transparent)' }

  return (
    <ModalShell accent={accent} onClose={onClose}>
      <div className="flex items-center justify-between px-6 py-4 border-b flex-shrink-0" style={{ borderColor: 'color-mix(in srgb, var(--color-text) 8%, transparent)' }}>
        <div className="flex items-center gap-2">
          <Tag size={16} style={{ color: accent }} aria-hidden="true" />
          <h3 className="text-lg" style={{ fontFamily: 'var(--font-playfair)', color: 'var(--color-text)' }}>Prices for {dest.city}</h3>
        </div>
        <button onClick={onClose} aria-label="Close panel" className="w-9 h-9 rounded-full flex items-center justify-center" style={{ backgroundColor: 'color-mix(in srgb, var(--color-text) 8%, transparent)', color: 'var(--color-subtle)' }}><X size={14} /></button>
      </div>

      <form onSubmit={handleFrom} className="flex items-center gap-2 px-6 py-3 border-b flex-shrink-0" style={{ borderColor: 'color-mix(in srgb, var(--color-text) 6%, transparent)' }}>
        <PlaneTakeoff size={14} style={{ color: 'var(--color-subtle)' }} aria-hidden="true" />
        <label htmlFor="home-city" className="text-xs whitespace-nowrap" style={{ color: 'var(--color-subtle)' }}>Flying from</label>
        <input id="home-city" value={draft} onChange={e => setDraft(e.target.value)} placeholder="Your city" maxLength={80}
          className="flex-1 min-w-0 min-h-9 px-3 rounded-full text-sm bg-transparent outline-none"
          style={{ color: 'var(--color-text)', border: '1px solid color-mix(in srgb, var(--color-text) 14%, transparent)' }} />
        <button type="submit" className="min-h-9 px-3 rounded-full text-xs font-medium" style={{ backgroundColor: accent, color: '#fff' }}>Update</button>
      </form>

      <div className="overflow-y-auto flex-1 px-6 py-4">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-6 h-6 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: accent, borderTopColor: 'transparent' }} />
          </div>
        ) : failed || !estimate ? (
          <p className="text-sm text-center py-6" style={{ color: 'var(--color-subtle)' }}>Couldn&apos;t estimate prices right now. The booking links below still work.</p>
        ) : (
          <div className="mb-2">
            {estimate.flight ? (
              <div className="flex items-start justify-between gap-3 pb-3 mb-3" style={line}>
                <div>
                  <p className="text-sm" style={{ color: 'var(--color-text)' }}>Flight from {from}</p>
                  <p className="text-xs" style={{ color: 'var(--color-subtle)' }}>{estimate.flight.note}</p>
                </div>
                <span className="text-sm font-medium whitespace-nowrap" style={{ color: accent }}>{estimate.flight.range}</span>
              </div>
            ) : (
              <p className="text-xs pb-3 mb-3" style={{ ...line, color: 'var(--color-subtle)' }}>Add where you&apos;re flying from to see a flight estimate.</p>
            )}
            <p className="text-xs tracking-widest uppercase mb-2" style={{ color: 'var(--color-subtle)' }}>Places to stay, per night</p>
            {estimate.stays.map(s => (
              <div key={s.tier} className="flex items-center justify-between gap-3 py-2" style={line}>
                <span className="text-sm" style={{ color: 'var(--color-text)' }}>{s.tier}</span>
                <span className="text-sm font-medium whitespace-nowrap" style={{ color: accent }}>{s.perNight}</span>
              </div>
            ))}
            {estimate.tip && <p className="text-xs mt-3" style={{ color: 'var(--color-text)' }}>{estimate.tip}</p>}
            <p className="text-xs italic mt-3" style={{ color: 'var(--color-subtle)' }}>Rough estimates in {estimate.currency}; check live prices before you book.</p>
          </div>
        )}

        <p className="text-xs tracking-widest uppercase mt-5 mb-2" style={{ color: 'var(--color-subtle)' }}>Search and book</p>
        <div className="grid grid-cols-3 gap-2">
          {bookingLinks(dest.city, dest.country, from).map(l => (
            <a key={l.label} href={l.href} target="_blank" rel="noopener noreferrer"
              className="flex flex-col items-center gap-1 py-3 rounded-xl text-xs font-medium"
              style={{ backgroundColor: `color-mix(in srgb, ${accent} 10%, transparent)`, color: 'var(--color-text)', border: `1px solid color-mix(in srgb, ${accent} 22%, transparent)` }}>
              <span className="flex items-center gap-1">{l.label} <ExternalLink size={11} aria-hidden="true" /></span>
              <span style={{ color: 'var(--color-subtle)' }}>{l.site}</span>
            </a>
          ))}
        </div>
      </div>
    </ModalShell>
  )
}

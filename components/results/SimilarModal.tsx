'use client'

import { useEffect, useState } from 'react'
import { Sparkles, X } from 'lucide-react'
import { ModalShell } from './ModalShell'
import type { Destination } from '@/types'

/* ── Similar destinations modal ── */
export function SimilarModal({ destination: dest, accent, onClose }: { destination: Destination; accent: string; onClose: () => void }) {
  const [similar, setSimilar] = useState<Destination[] | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/suggest', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        preferences: {
          summary: `Destinations with a similar vibe and feel to ${dest.city} — ${dest.tagline}`,
          climate: 'similar climate',
          budget: 'any',
          travelStyle: dest.bestFor.slice(0, 3).join(', ') || 'open',
          foodPreferences: 'similar cuisine culture',
          other: `Must not include ${dest.city}. Similar cultural atmosphere.`,
        },
      }),
    })
      .then(r => r.json())
      .then((d: Destination[]) => setSimilar(d.filter(s => s.city !== dest.city)))
      .catch(() => null)
      .finally(() => setLoading(false))
  }, [])

  return (
    <ModalShell accent={accent} onClose={onClose}>
      <div className="flex items-center justify-between px-6 py-4 border-b flex-shrink-0" style={{ borderColor: 'color-mix(in srgb, var(--color-text) 8%, transparent)' }}>
        <div className="flex items-center gap-2">
          <Sparkles size={16} style={{ color: accent }} />
          <h3 className="text-lg" style={{ fontFamily: 'var(--font-playfair)', color: 'var(--color-text)' }}>Similar to {dest.city}</h3>
        </div>
        <button onClick={onClose} aria-label="Close panel" className="w-7 h-7 rounded-full flex items-center justify-center" style={{ backgroundColor: 'color-mix(in srgb, var(--color-text) 8%, transparent)', color: 'var(--color-subtle)' }}><X size={14} /></button>
      </div>
      <div className="overflow-y-auto flex-1 px-6 py-4">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-6 h-6 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: accent, borderTopColor: 'transparent' }} />
          </div>
        ) : similar && similar.length > 0 ? (
          <div className="space-y-3">
            {similar.map(s => (
              <div key={s.city} className="flex items-start gap-3 p-3 rounded-2xl"
                style={{ backgroundColor: 'color-mix(in srgb, var(--color-text) 4%, transparent)', border: '1px solid color-mix(in srgb, var(--color-text) 8%, transparent)' }}>
                <span className="text-2xl">{s.flagEmoji}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm" style={{ color: 'var(--color-text)' }}>{s.city}</p>
                  <p className="text-xs mb-1" style={{ color: 'var(--color-subtle)' }}>{s.country} · {s.region}</p>
                  <p className="text-xs italic line-clamp-2" style={{ color: s.culturalTheme.accent }}>{s.tagline}</p>
                </div>
              </div>
            ))}
          </div>
        ) : <p className="text-sm text-center py-8" style={{ color: 'var(--color-subtle)' }}>No similar destinations found.</p>}
      </div>
    </ModalShell>
  )
}

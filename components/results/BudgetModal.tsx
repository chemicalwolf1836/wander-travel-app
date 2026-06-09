'use client'

import { useEffect, useState } from 'react'
import { Wallet, X } from 'lucide-react'
import { toast } from 'sonner'
import { ModalShell } from './ModalShell'
import type { Destination } from '@/types'

type Style = 'budget' | 'mid' | 'luxury'
type BudgetCategory = { name: string; cost: string; note: string }
type BudgetEstimate = { currency: string; dailyTotal: string; categories: BudgetCategory[] }

const STYLES: { id: Style; label: string }[] = [
  { id: 'budget', label: 'Budget' },
  { id: 'mid', label: 'Mid-range' },
  { id: 'luxury', label: 'Luxury' },
]

/* ── Budget estimator modal ── */
export function BudgetModal({ destination: dest, accent, onClose }: { destination: Destination; accent: string; onClose: () => void }) {
  const [estimate, setEstimate] = useState<BudgetEstimate | null>(null)
  const [loading, setLoading] = useState(true)
  const [style, setStyle] = useState<Style>('mid')

  async function fetchBudget(s: Style) {
    setLoading(true)
    try {
      const res = await fetch('/api/budget', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ city: dest.city, country: dest.country, style: s }),
      })
      if (res.ok) setEstimate(await res.json() as BudgetEstimate)
      else toast.error("Couldn't estimate a budget. Please try again.")
    } catch {
      toast.error("Couldn't estimate a budget. Please try again.")
    }
    setLoading(false)
  }

  useEffect(() => { fetchBudget(style) }, [])

  return (
    <ModalShell accent={accent} onClose={onClose}>
      <div className="flex items-center justify-between px-6 py-4 border-b flex-shrink-0" style={{ borderColor: 'color-mix(in srgb, var(--color-text) 8%, transparent)' }}>
        <div className="flex items-center gap-2">
          <Wallet size={16} style={{ color: accent }} />
          <h3 className="text-lg" style={{ fontFamily: 'var(--font-playfair)', color: 'var(--color-text)' }}>Daily budget for {dest.city}</h3>
        </div>
        <button onClick={onClose} aria-label="Close panel" className="w-7 h-7 rounded-full flex items-center justify-center" style={{ backgroundColor: 'color-mix(in srgb, var(--color-text) 8%, transparent)', color: 'var(--color-subtle)' }}><X size={14} /></button>
      </div>
      <div className="flex items-center gap-2 px-6 py-3 border-b flex-shrink-0" style={{ borderColor: 'color-mix(in srgb, var(--color-text) 6%, transparent)' }}>
        <span className="text-xs" style={{ color: 'var(--color-subtle)' }}>Style:</span>
        {STYLES.map(s => (
          <button key={s.id} onClick={() => { setStyle(s.id); fetchBudget(s.id) }}
            className="text-xs px-2.5 py-1 rounded-full transition-colors"
            style={{
              backgroundColor: style === s.id ? accent : 'color-mix(in srgb, var(--color-text) 8%, transparent)',
              color: style === s.id ? '#fff' : 'var(--color-subtle)',
            }}>{s.label}</button>
        ))}
      </div>
      <div className="overflow-y-auto flex-1 px-6 py-4">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-6 h-6 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: accent, borderTopColor: 'transparent' }} />
          </div>
        ) : estimate ? (
          <div>
            {/* Headline daily total */}
            <div className="flex items-baseline gap-2 mb-5">
              <span className="text-2xl font-semibold" style={{ color: 'var(--color-text)', fontFamily: 'var(--font-playfair)' }}>{estimate.dailyTotal}</span>
              <span className="text-xs" style={{ color: 'var(--color-subtle)' }}>per day · {estimate.currency}</span>
            </div>
            <div className="space-y-2.5">
              {estimate.categories.map(cat => (
                <div key={cat.name} className="flex items-start justify-between gap-3 pb-2.5"
                  style={{ borderBottom: '1px solid color-mix(in srgb, var(--color-text) 6%, transparent)' }}>
                  <div className="min-w-0">
                    <p className="text-sm" style={{ color: 'var(--color-text)' }}>{cat.name}</p>
                    {cat.note && <p className="text-xs" style={{ color: 'var(--color-subtle)' }}>{cat.note}</p>}
                  </div>
                  <span className="text-sm font-medium whitespace-nowrap" style={{ color: accent }}>{cat.cost}</span>
                </div>
              ))}
            </div>
            <p className="text-xs italic mt-4" style={{ color: 'var(--color-subtle)' }}>
              Estimates only — actual costs vary by season and choices.
            </p>
          </div>
        ) : <p className="text-sm text-center py-8" style={{ color: 'var(--color-subtle)' }}>Failed to load. Try again.</p>}
      </div>
    </ModalShell>
  )
}

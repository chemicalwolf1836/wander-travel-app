'use client'

import { useEffect, useMemo, useState } from 'react'
import { ExternalLink, ShieldCheck, X } from 'lucide-react'
import { ModalShell } from './ModalShell'
import { getPassport, savePassport } from '@/lib/travelProfile'
import { countryOptions, countryName, advisoryLinks } from '@/lib/countries'
import type { Destination } from '@/types'
import type { VisaInfo } from '@/app/api/visa/route'

const REQUIREMENT_LABEL: Record<VisaInfo['requirement'], string> = {
  'none': 'No visa needed',
  'on-arrival': 'Visa on arrival',
  'e-visa': 'Apply for an e-visa',
  'required': 'Visa required before travel',
  'unknown': 'Check official sources',
}

const ADVISORY_LABEL = ['', 'Normal precautions', 'Increased caution', 'Reconsider travel', 'Do not travel']

/* ── Visa + travel advisory check ── */
export function VisaModal({ destination: dest, accent, onClose }: { destination: Destination; accent: string; onClose: () => void }) {
  const options = useMemo(() => countryOptions(), [])
  const [passport, setPassport] = useState('')
  const [info, setInfo] = useState<VisaInfo | null>(null)
  const [loading, setLoading] = useState(false)
  const [failed, setFailed] = useState(false)

  async function load(code: string) {
    if (!code) { setInfo(null); return }
    setLoading(true)
    setFailed(false)
    try {
      const res = await fetch('/api/visa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ passport: code, passportName: countryName(code), country: dest.country }),
      })
      if (!res.ok) throw new Error()
      setInfo(await res.json() as VisaInfo)
    } catch {
      setFailed(true)
    }
    setLoading(false)
  }

  useEffect(() => {
    const saved = getPassport()
    setPassport(saved)
    load(saved)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function handlePassport(code: string) {
    setPassport(code)
    savePassport(code)
    load(code)
  }

  const sameCountry = passport && passport === dest.countryCode?.toUpperCase()

  return (
    <ModalShell accent={accent} onClose={onClose}>
      <div className="flex items-center justify-between px-6 py-4 border-b flex-shrink-0" style={{ borderColor: 'color-mix(in srgb, var(--color-text) 8%, transparent)' }}>
        <div className="flex items-center gap-2">
          <ShieldCheck size={16} style={{ color: accent }} aria-hidden="true" />
          <h3 className="text-lg" style={{ fontFamily: 'var(--font-playfair)', color: 'var(--color-text)' }}>Entry and safety: {dest.country}</h3>
        </div>
        <button onClick={onClose} aria-label="Close panel" className="w-9 h-9 rounded-full flex items-center justify-center" style={{ backgroundColor: 'color-mix(in srgb, var(--color-text) 8%, transparent)', color: 'var(--color-subtle)' }}><X size={14} /></button>
      </div>

      <div className="flex items-center gap-2 px-6 py-3 border-b flex-shrink-0" style={{ borderColor: 'color-mix(in srgb, var(--color-text) 6%, transparent)' }}>
        <label htmlFor="passport" className="text-xs whitespace-nowrap" style={{ color: 'var(--color-subtle)' }}>Your passport</label>
        <select id="passport" value={passport} onChange={e => handlePassport(e.target.value)}
          className="flex-1 min-w-0 min-h-9 px-3 rounded-full text-sm outline-none cursor-pointer"
          style={{ backgroundColor: 'var(--color-card-bg)', color: 'var(--color-text)', border: '1px solid color-mix(in srgb, var(--color-text) 14%, transparent)' }}>
          <option value="">Choose a country</option>
          {options.map(o => <option key={o.code} value={o.code}>{o.name}</option>)}
        </select>
      </div>

      <div className="overflow-y-auto flex-1 px-6 py-4">
        {!passport ? (
          <p className="text-sm py-6 text-center" style={{ color: 'var(--color-subtle)' }}>Pick your passport to see what you need to enter {dest.country}.</p>
        ) : sameCountry ? (
          <p className="text-sm py-6 text-center" style={{ color: 'var(--color-text)' }}>That&apos;s your own country, so no visa is needed.</p>
        ) : loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-6 h-6 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: accent, borderTopColor: 'transparent' }} />
          </div>
        ) : failed || !info ? (
          <p className="text-sm text-center py-6" style={{ color: 'var(--color-subtle)' }}>Couldn&apos;t check right now. Try again, or use the official links below.</p>
        ) : (
          <div className="flex flex-col gap-4">
            <div>
              <p className="text-base font-semibold" style={{ color: accent }}>{REQUIREMENT_LABEL[info.requirement]}</p>
              <p className="text-sm mt-1" style={{ color: 'var(--color-text)' }}>{info.summary}</p>
              {info.maxStay && <p className="text-xs mt-1" style={{ color: 'var(--color-subtle)' }}>Typical stay allowed: {info.maxStay}</p>}
            </div>
            <div className="pt-3" style={{ borderTop: '1px solid color-mix(in srgb, var(--color-text) 8%, transparent)' }}>
              <p className="text-xs tracking-widest uppercase mb-1" style={{ color: 'var(--color-subtle)' }}>Safety</p>
              {info.advisory.level && (
                <p className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>Level {info.advisory.level}: {ADVISORY_LABEL[info.advisory.level]}</p>
              )}
              <p className="text-sm" style={{ color: 'var(--color-text)' }}>{info.advisory.summary}</p>
            </div>
          </div>
        )}

        <p className="text-xs italic mt-5" style={{ color: 'var(--color-subtle)' }}>
          AI-generated guidance that can be out of date. Always confirm with the embassy or an official government source before you travel.
        </p>
        <div className="flex flex-wrap gap-2 mt-3">
          {advisoryLinks(dest.country).map(l => (
            <a key={l.label} href={l.href} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-1 min-h-9 px-3 rounded-full text-xs"
              style={{ border: '1px solid color-mix(in srgb, var(--color-text) 14%, transparent)', color: 'var(--color-text)' }}>
              {l.label} <ExternalLink size={11} aria-hidden="true" />
            </a>
          ))}
        </div>
      </div>
    </ModalShell>
  )
}

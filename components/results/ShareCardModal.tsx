'use client'

import { motion } from 'framer-motion'
import { Share2 } from 'lucide-react'
import { toast } from 'sonner'
import type { Destination } from '@/types'

/* ── Share card modal ── */
export function ShareCardModal({ destination: dest, imageUrl, onClose }: { destination: Destination; imageUrl: string | null; onClose: () => void }) {
  const theme = dest.culturalTheme

  async function handleCopy() {
    const text = `✈️ ${dest.city}, ${dest.country} — ${dest.tagline} | Discovered on Wander`
    await navigator.clipboard.writeText(text).catch(() => null)
    toast('Copied to clipboard')
  }

  async function handleNativeShare() {
    const text = `✈️ ${dest.city}, ${dest.country} — ${dest.tagline} | Discovered on Wander`
    await navigator.share({ title: dest.city, text }).catch(() => null)
  }

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center p-6"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <div className="absolute inset-0" style={{ backgroundColor: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)' }} />
      <motion.div
        className="relative z-10 flex flex-col items-center gap-4"
        initial={{ scale: 0.88, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
        transition={{ type: 'spring', damping: 22, stiffness: 300 }}
        onClick={e => e.stopPropagation()}
      >
        {/* The poster card */}
        <div className="rounded-3xl overflow-hidden relative"
          style={{ width: 320, height: 480, background: `linear-gradient(160deg, ${theme.primary}, ${theme.accent} 120%)` }}>
          {imageUrl && (
            <img src={imageUrl} alt={dest.city} className="absolute inset-0 w-full h-full object-cover"
              style={{ filter: 'brightness(0.6) saturate(1.3)', mixBlendMode: 'luminosity' }} />
          )}
          <div className="absolute inset-0" style={{ background: `linear-gradient(to top, ${theme.primary}ee 0%, ${theme.primary}88 40%, transparent 100%)` }} />
          <div className="absolute top-5 right-5 text-4xl">{dest.emoji}</div>
          <div className="absolute bottom-0 left-0 right-0 p-8">
            <p className="text-xs tracking-widest uppercase mb-2" style={{ color: 'rgba(255,255,255,0.6)' }}>Discovered on Wander</p>
            <h2 className="text-5xl text-white leading-none mb-1" style={{ fontFamily: 'var(--font-playfair)' }}>{dest.city}</h2>
            <p className="text-sm mb-3" style={{ color: 'rgba(255,255,255,0.75)' }}>{dest.country} · {dest.region}</p>
            <p className="text-sm italic leading-snug" style={{ color: 'rgba(255,255,255,0.85)' }}>{dest.tagline}</p>
            <div className="flex flex-wrap gap-1.5 mt-4">
              {dest.bestFor.slice(0, 3).map(b => (
                <span key={b} className="text-xs px-2.5 py-1 rounded-full" style={{ backgroundColor: 'rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(4px)' }}>{b}</span>
              ))}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button onClick={handleCopy}
            className="flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium"
            style={{ backgroundColor: 'rgba(255,255,255,0.15)', color: '#fff', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.2)' }}>
            Copy text
          </button>
          {'share' in navigator && (
            <button onClick={handleNativeShare}
              className="flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium"
              style={{ backgroundColor: theme.accent, color: theme.background }}>
              Share <Share2 size={13} />
            </button>
          )}
        </div>
        <p className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>Screenshot the card to save it</p>
      </motion.div>
    </motion.div>
  )
}

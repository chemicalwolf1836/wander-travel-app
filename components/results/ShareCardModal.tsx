'use client'

import { textOn } from '@/lib/contrast'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { Share2 } from 'lucide-react'
import { toast } from 'sonner'
import { useDismissable } from '@/lib/useDismissable'
import { publishDestination } from '@/lib/sharedDestinations'
import type { Destination } from '@/types'

/* ── Share card modal ── */
export function ShareCardModal({ destination: dest, imageUrl, onClose }: { destination: Destination; imageUrl: string | null; onClose: () => void }) {
  const theme = dest.culturalTheme
  const dialogRef = useDismissable<HTMLDivElement>(onClose)

  // The link opens the destination on any device (it's stored server-side).
  const shareUrl = typeof window === 'undefined'
    ? ''
    : `${window.location.origin}/destination/${encodeURIComponent(dest.city)}`
  const shareText = `✈️ ${dest.city}, ${dest.country} — ${dest.tagline} | Discovered on Wander`

  async function handleCopy() {
    publishDestination(dest)
    await navigator.clipboard.writeText(`${shareText}\n${shareUrl}`).catch(() => null)
    toast('Link copied')
  }

  async function handleNativeShare() {
    publishDestination(dest)
    await navigator.share({ title: dest.city, text: shareText, url: shareUrl }).catch(() => null)
  }

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center p-6"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <div className="absolute inset-0" style={{ backgroundColor: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)' }} />
      <motion.div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        tabIndex={-1}
        className="relative z-10 flex flex-col items-center gap-4 outline-none"
        initial={{ scale: 0.88, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
        transition={{ type: 'spring', damping: 22, stiffness: 300 }}
        onClick={e => e.stopPropagation()}
      >
        {/* The poster card */}
        <div className="rounded-3xl overflow-hidden relative"
          style={{ width: 320, height: 480, background: `linear-gradient(160deg, ${theme.primary}, ${theme.accent} 120%)` }}>
          {imageUrl && (
            <Image src={imageUrl} alt={dest.city} fill sizes="320px" className="object-cover"
              style={{ filter: 'brightness(0.6) saturate(1.3)', mixBlendMode: 'luminosity' }} />
          )}
          <div className="absolute inset-0" style={{ background: `linear-gradient(to top, ${theme.primary}ee 0%, ${theme.primary}88 40%, transparent 100%)` }} />
          <div className="absolute top-5 right-5 text-4xl">{dest.emoji}</div>
          <div className="absolute bottom-0 left-0 right-0 p-8">
            <p className="text-[13px] font-medium mb-2" style={{ color: 'rgba(255,255,255,0.85)' }}>Discovered on Wander</p>
            <h2 className="text-5xl font-light text-white leading-none mb-1" style={{ fontFamily: 'var(--font-outfit)' }}>{dest.city}</h2>
            <p className="text-sm mb-3" style={{ color: 'rgba(255,255,255,0.9)' }}>{dest.country} · {dest.region}</p>
            <p className="text-sm leading-snug" style={{ color: '#ffffff' }}>{dest.tagline}</p>
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
            className="flex items-center gap-2 min-h-11 px-5 rounded-[14px] text-sm font-medium bg-white/15 text-white border border-white/20 backdrop-blur-md transition-colors hover:bg-white hover:text-black active:scale-[0.97]">
            Copy link
          </button>
          {'share' in navigator && (
            <button onClick={handleNativeShare}
              className="mono-cta flex items-center gap-2 min-h-11 px-5 rounded-[14px] text-sm font-medium"
              style={{ backgroundColor: theme.accent, color: textOn(theme.accent) }}>
              Share <Share2 size={13} />
            </button>
          )}
        </div>
        <p className="text-xs" style={{ color: 'rgba(255,255,255,0.75)' }}>Screenshot the card to save it</p>
      </motion.div>
    </motion.div>
  )
}

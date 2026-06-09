'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { X } from 'lucide-react'
import { itemInfoCache } from '@/lib/itemInfoCache'
import { useDismissable } from '@/lib/useDismissable'

/* ── Item detail modal ── */
export function ItemModal({ item, city, accent, onClose }: { item: string; city: string; accent: string; onClose: () => void }) {
  const dialogRef = useDismissable<HTMLDivElement>(onClose)
  const key = `${item}::${city}`
  const [data, setData] = useState<{ image?: string; description?: string } | null>(
    itemInfoCache.get(key) ?? null
  )
  const [loading, setLoading] = useState(!itemInfoCache.has(key))

  useEffect(() => {
    const k = `${item}::${city}`
    if (itemInfoCache.has(k)) {
      setData(itemInfoCache.get(k)!)
      setLoading(false)
      return
    }
    setLoading(true)
    setData(null)
    fetch(`/api/item-info?name=${encodeURIComponent(item)}&context=${encodeURIComponent(city)}`)
      .then(r => r.json())
      .then((d: { image?: string; description?: string }) => {
        itemInfoCache.set(k, d)
        setData(d)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [item, city])

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center p-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0" style={{ backgroundColor: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)' }} />

      {/* Card */}
      <motion.div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        tabIndex={-1}
        className="relative rounded-3xl overflow-hidden flex flex-col z-10 outline-none"
        style={{
          width: '100%',
          maxWidth: 520,
          maxHeight: '80vh',
          backgroundColor: 'var(--color-card-bg)',
          border: `1px solid color-mix(in srgb, ${accent} 30%, transparent)`,
          boxShadow: `0 0 60px color-mix(in srgb, ${accent} 25%, transparent), 0 24px 48px rgba(0,0,0,0.5)`,
        }}
        initial={{ scale: 0.82, y: 24, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        exit={{ scale: 0.9, y: 16, opacity: 0 }}
        transition={{ type: 'spring', damping: 22, stiffness: 320 }}
        onClick={e => e.stopPropagation()}
      >
        {/* Image */}
        <div className="relative flex-shrink-0 overflow-hidden" style={{ height: 220 }}>
          {data?.image && !loading ? (
            <img src={data.image} alt={item} className="w-full h-full object-cover"
              style={{ filter: 'brightness(0.88) saturate(1.15)' }} />
          ) : (
            <div className="w-full h-full flex items-center justify-center"
              style={{ background: `linear-gradient(135deg, color-mix(in srgb, ${accent} 30%, #000), color-mix(in srgb, ${accent} 60%, #000))` }}>
              {loading && <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin"
                style={{ borderColor: accent, borderTopColor: 'transparent' }} />}
            </div>
          )}
          <div className="absolute inset-0"
            style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.65) 0%, transparent 60%)' }} />
          <div className="absolute bottom-0 left-0 right-0 px-6 pb-4">
            <h3 className="text-2xl text-white leading-tight"
              style={{ fontFamily: 'var(--font-playfair)', textShadow: '0 2px 8px rgba(0,0,0,0.6)' }}>
              {item}
            </h3>
          </div>
          <button onClick={onClose} aria-label="Close"
            className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center"
            style={{ backgroundColor: 'rgba(0,0,0,0.5)', color: 'white' }}>
            <X size={14} />
          </button>
        </div>

        {/* Body */}
        {(loading || data !== null) && (
          <div className="overflow-y-auto px-6 py-5">
            {loading ? (
              <div className="flex gap-2 items-center" style={{ color: 'var(--color-subtle)' }}>
                <div className="w-4 h-4 rounded-full border-2 border-t-transparent animate-spin"
                  style={{ borderColor: accent, borderTopColor: 'transparent' }} />
                <span className="text-xs">Loading…</span>
              </div>
            ) : data?.description ? (
              <p className="text-sm leading-relaxed" style={{ color: 'var(--color-text)' }}>
                {data.description}
              </p>
            ) : (
              <p className="text-sm italic" style={{ color: 'var(--color-subtle)' }}>
                No information available.
              </p>
            )}
          </div>
        )}
      </motion.div>
    </motion.div>
  )
}

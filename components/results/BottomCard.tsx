'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion'
import { ArrowRight, GitCompare, CalendarDays, Heart } from 'lucide-react'
import { useDestinationImage } from '@/lib/useDestinationImage'
import { isFavourite, toggleFavourite } from '@/lib/favourites'
import { Flag } from './Flag'
import { readableOn, textOn } from '@/lib/contrast'
import type { Destination } from '@/types'

/* ── Bottom strip card ── */
export function BottomCard({
  destination: dest,
  index,
  isRevealed,
  isHovered,
  isSelected,
  anyHovered,
  isComparing,
  comparePending = false,
  onHover,
  onLeave,
  onClick,
  onCompare,
}: {
  destination: Destination
  index: number
  isRevealed: boolean
  isHovered: boolean
  isSelected: boolean
  anyHovered: boolean
  isComparing: boolean
  /** Another card is waiting for a second pick — clicking this one compares */
  comparePending?: boolean
  onHover: () => void
  onLeave: () => void
  onClick: () => void
  onCompare: () => void
}) {
  const image = useDestinationImage(dest.city, dest.country)
  const [imgLoaded, setImgLoaded] = useState(false)
  const imgRef = useRef<HTMLImageElement>(null)
  // Catch already-cached images that load before onLoad is attached
  useEffect(() => {
    const el = imgRef.current
    if (el?.complete && el.naturalWidth > 0) setImgLoaded(true)
  }, [image])
  const theme = dest.culturalTheme
  const active = isHovered || isSelected
  // Text sits on a near-black scrim over the photo; keep the accent readable there.
  const taglineColor = readableOn(theme.accent, '#000000', 7)
  const onAccent = textOn(theme.accent)
  const [saved, setSaved] = useState(false)
  useEffect(() => { setSaved(isFavourite(dest.city)) }, [dest.city])

  // 3D tilt
  const cardRef = useRef<HTMLDivElement>(null)
  const rawRotX = useMotionValue(0)
  const rawRotY = useMotionValue(0)
  const rotX = useSpring(rawRotX, { stiffness: 280, damping: 22 })
  const rotY = useSpring(rawRotY, { stiffness: 280, damping: 22 })
  const imgX = useTransform(rotY, [-12, 12], ['10px', '-10px'])
  const imgY = useTransform(rotX, [-10, 10], ['8px', '-8px'])

  function handleTiltMove(e: React.MouseEvent<HTMLDivElement>) {
    const el = cardRef.current
    if (!el) return
    const { left, top, width, height } = el.getBoundingClientRect()
    rawRotY.set(((e.clientX - left) / width - 0.5) * 22)
    rawRotX.set(-((e.clientY - top) / height - 0.5) * 16)
  }
  function handleTiltLeave() { rawRotX.set(0); rawRotY.set(0) }

  return (
    // Outer: cinematic reveal + perspective
    <motion.div
      style={{ flex: '1 0 260px', maxWidth: 360, perspective: 800 }}
      initial={{ opacity: 0, scale: 0.88, y: 16, filter: 'blur(8px)' }}
      animate={{
        opacity: isRevealed ? 1 : 0,
        scale: isRevealed ? 1 : 0.88,
        y: isRevealed ? 0 : 16,
        filter: isRevealed ? 'blur(0px)' : 'blur(8px)',
      }}
      transition={{
        opacity: { type: 'spring', damping: 24, stiffness: 180, delay: isRevealed ? index * 0.18 : 0 },
        scale: { type: 'spring', damping: 24, stiffness: 180, delay: isRevealed ? index * 0.18 : 0 },
        y: { type: 'spring', damping: 24, stiffness: 180, delay: isRevealed ? index * 0.18 : 0 },
        filter: { duration: 0.5, ease: 'easeOut', delay: isRevealed ? index * 0.18 : 0 },
      }}
    >
    {/* Inner: tilt + hover scale + dim */}
    <motion.div
      ref={cardRef}
      className="relative rounded-[20px] overflow-hidden cursor-pointer"
      style={{
        height: 'clamp(260px, 36vh, 340px)',
        width: '100%',
        boxShadow: '0 14px 32px rgba(0,0,0,0.28)',
        rotateX: rotX,
        rotateY: rotY,
        border: `1px solid ${active
          ? `color-mix(in srgb, ${theme.accent} 60%, transparent)`
          : 'color-mix(in srgb, var(--color-text) 10%, transparent)'}`,
        transition: 'border-color 0.3s ease',
      }}
      onMouseMove={handleTiltMove}
      onMouseEnter={onHover}
      onMouseLeave={() => { handleTiltLeave(); onLeave() }}
      onClick={onClick}
      animate={{ opacity: anyHovered && !isHovered ? 0.7 : 1 }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.25 }}
    >
      {/* Background image — gradient base shows instantly, photo (thumb) fades in over it */}
      <div className="absolute inset-0"
        style={{ background: `linear-gradient(135deg, ${theme.primary}, ${theme.accent})`, opacity: 0.7 }} />
      {image?.src && (
        <motion.img ref={imgRef} src={image.thumb} alt={dest.city} loading="lazy" decoding="async"
          onLoad={() => setImgLoaded(true)}
          className="absolute inset-0 w-full h-full object-cover"
          style={{ filter: 'brightness(1.02) saturate(1.25) contrast(1.08)', x: imgX, y: imgY, scale: 1.12, opacity: imgLoaded ? 1 : 0, transition: 'opacity 500ms ease' }} />
      )}

      {/* Gradient overlay */}
      <div className="absolute inset-0"
        style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.72) 40%, rgba(0,0,0,0.15) 70%, rgba(0,0,0,0.3) 100%)' }} />


      {/* Top row: how it suits the travel month, and save */}
      <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2">
        {dest.monthFit ? (
          <span
            className="inline-flex items-center gap-1.5 min-w-0 min-h-8 px-3 rounded-full text-xs font-medium pointer-events-none"
            style={{ backgroundColor: 'rgba(0,0,0,0.55)', color: '#fff', backdropFilter: 'blur(6px)' }}
            title={dest.monthFit}
          >
            <CalendarDays size={13} aria-hidden="true" className="flex-shrink-0" />
            <span className="truncate">{dest.monthFit}</span>
          </span>
        ) : <span />}
        <button
          className="flex-shrink-0 w-11 h-11 rounded-full flex items-center justify-center"
          style={{ backgroundColor: 'rgba(0,0,0,0.55)', color: '#fff', backdropFilter: 'blur(6px)' }}
          onClick={(e) => { e.stopPropagation(); setSaved(toggleFavourite(dest)) }}
          aria-label={saved ? `Remove ${dest.city} from saved` : `Save ${dest.city}`}
          aria-pressed={saved}
          title={saved ? 'Saved' : 'Save'}
        >
          <Heart size={17} fill={saved ? 'currentColor' : 'none'} aria-hidden="true" />
        </button>
      </div>

      {/* Content */}
      <div className="absolute inset-x-0 bottom-0 flex flex-col p-5"
        style={{ textShadow: '0 1px 4px rgba(0,0,0,0.9)' }}>
        <h3 className="text-[32px] leading-none mb-1.5 font-light"
          style={{ fontFamily: 'var(--font-outfit)', color: '#ffffff' }}>
          {dest.city}
        </h3>
        <p className="text-sm mb-1.5 flex items-center gap-1.5" style={{ color: 'rgba(255,255,255,0.92)' }}>
          <Flag code={dest.countryCode} size={16} /> {dest.country}
        </p>
        <p className="text-sm line-clamp-1 mb-4" style={{ color: taglineColor }}>
          {dest.tagline}
        </p>

        <div className="flex gap-2.5" style={{ textShadow: 'none' }}>
          <button
            className="mono-cta flex-1 flex items-center justify-center gap-2 min-h-12 rounded-[14px] text-sm font-semibold"
            style={{
              backgroundColor: active || comparePending ? theme.accent : '#ffffff',
              color: active || comparePending ? onAccent : '#111827',
              transition: 'background-color 0.3s ease, color 0.3s ease, filter 200ms ease, transform 200ms ease',
            }}
            onClick={(e) => { e.stopPropagation(); onClick() }}
          >
            {comparePending
              ? <><GitCompare size={15} aria-hidden="true" /> Compare</>
              : <>View details <ArrowRight size={15} aria-hidden="true" /></>}
          </button>
          <button
            className="flex items-center justify-center rounded-[14px] w-12 min-h-12"
            style={{
              backgroundColor: isComparing ? theme.accent : 'rgba(255,255,255,0.14)',
              color: isComparing ? onAccent : '#ffffff',
              border: isComparing ? '0' : '1px solid rgba(255,255,255,0.35)',
              transition: 'background-color 0.3s ease',
            }}
            onClick={(e) => { e.stopPropagation(); onCompare() }}
            aria-label={isComparing ? `Stop comparing ${dest.city}` : `Compare ${dest.city}`}
            aria-pressed={isComparing}
            title="Compare"
          >
            <GitCompare size={17} aria-hidden="true" />
          </button>
        </div>
      </div>
    </motion.div>
    </motion.div>
  )
}

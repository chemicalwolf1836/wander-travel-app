'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion'
import { ArrowRight, GitCompare, CalendarDays } from 'lucide-react'
import { useDestinationImage } from '@/lib/useDestinationImage'
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
      style={{ flex: 1, minWidth: 200, perspective: 800 }}
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
      className="relative rounded-2xl overflow-hidden cursor-pointer"
      style={{
        height: 200,
        width: '100%',
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
        style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.75) 50%, rgba(0,0,0,0.35) 80%, rgba(0,0,0,0.15) 100%)' }} />


      {/* Index number */}
      <div className="absolute top-3 left-4 text-xs font-medium pointer-events-none" style={{ color: 'rgba(255,255,255,0.75)', textShadow: '0 1px 3px rgba(0,0,0,0.8)' }}>
        {String(index + 1).padStart(2, '0')}
      </div>

      {/* How it suits the chosen travel month */}
      {dest.monthFit && (
        <div
          className="absolute top-2.5 right-2.5 left-12 flex justify-end pointer-events-none"
          title={dest.monthFit}
        >
          <span
            className="inline-flex items-center gap-1 max-w-full px-2 py-1 rounded-full text-[10px] font-medium truncate"
            style={{ backgroundColor: 'rgba(0,0,0,0.55)', color: '#fff', backdropFilter: 'blur(6px)' }}
          >
            <CalendarDays size={10} aria-hidden="true" className="flex-shrink-0" />
            <span className="truncate">{dest.monthFit}</span>
          </span>
        </div>
      )}

      {/* Content */}
      <div className="absolute inset-0 flex flex-col justify-end p-4"
        style={{ textShadow: '0 1px 4px rgba(0,0,0,1), 0 2px 12px rgba(0,0,0,0.9)' }}>
        <h3 className="text-xl leading-tight mb-0.5 font-semibold"
          style={{ fontFamily: 'var(--font-playfair)', color: '#ffffff' }}>
          {dest.city}
        </h3>
        <p className="text-xs mb-2 flex items-center gap-1.5" style={{ color: 'rgba(255,255,255,0.88)' }}>
          <Flag code={dest.countryCode} size={16} /> {dest.country}
        </p>

        <p
          className="text-xs italic line-clamp-1 mb-3 font-medium"
          style={{ color: taglineColor, textShadow: '0 1px 4px rgba(0,0,0,0.8)' }}
        >
          {dest.tagline}
        </p>

        <div className="flex gap-1.5">
          <button
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold"
            style={{
              backgroundColor: active ? theme.accent : 'rgba(255,255,255,0.22)',
              color: active ? onAccent : '#ffffff',
              textShadow: active ? 'none' : undefined,
              transition: 'background-color 0.3s ease, color 0.3s ease',
            }}
            onClick={(e) => { e.stopPropagation(); onClick() }}
          >
            {comparePending
              ? <><GitCompare size={11} aria-hidden="true" /> Compare</>
              : <>View details <ArrowRight size={11} aria-hidden="true" /></>}
          </button>
          <button
            className="flex items-center justify-center rounded-lg min-w-9"
            style={{
              backgroundColor: isComparing ? theme.accent : 'rgba(255,255,255,0.22)',
              color: isComparing ? onAccent : '#ffffff',
              transition: 'background-color 0.3s ease',
            }}
            onClick={(e) => { e.stopPropagation(); onCompare() }}
            aria-label={isComparing ? `Stop comparing ${dest.city}` : `Compare ${dest.city}`}
            aria-pressed={isComparing}
            title="Compare"
          >
            <GitCompare size={13} aria-hidden="true" />
          </button>
        </div>
      </div>
    </motion.div>
    </motion.div>
  )
}

'use client'

import { useState, useRef } from 'react'
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion'
import { ArrowRight, GitCompare } from 'lucide-react'
import { useDestinationImage } from '@/lib/useDestinationImage'
import { Flag } from './Flag'
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
  onHover: () => void
  onLeave: () => void
  onClick: () => void
  onCompare: () => void
}) {
  const image = useDestinationImage(dest.city, dest.country)
  const [imgLoaded, setImgLoaded] = useState(false)
  const theme = dest.culturalTheme
  const active = isHovered || isSelected

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
        height: 180,
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
        <motion.img src={image.thumb} alt={dest.city} loading="lazy" decoding="async"
          onLoad={() => setImgLoaded(true)}
          className="absolute inset-0 w-full h-full object-cover"
          style={{ filter: 'brightness(1.02) saturate(1.25) contrast(1.08)', x: imgX, y: imgY, scale: 1.12, opacity: imgLoaded ? 1 : 0, transition: 'opacity 500ms ease' }} />
      )}

      {/* Gradient overlay */}
      <div className="absolute inset-0"
        style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.7) 45%, rgba(0,0,0,0.2) 80%, transparent 100%)' }} />


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
          style={{ color: theme.accent, filter: 'brightness(1.2) saturate(1.3)', textShadow: '0 1px 4px rgba(0,0,0,0.8)' }}
        >
          {dest.tagline}
        </p>

        <div className="flex gap-1.5">
          <button
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold"
            style={{
              backgroundColor: active ? theme.accent : 'rgba(255,255,255,0.18)',
              color: active ? theme.background : '#ffffff',
              transition: 'background-color 0.3s ease, color 0.3s ease',
            }}
            onClick={(e) => { e.stopPropagation(); onClick() }}
          >
            View details <ArrowRight size={11} />
          </button>
          <button
            className="flex items-center justify-center rounded-lg px-2"
            style={{
              backgroundColor: isComparing ? theme.accent : 'rgba(255,255,255,0.18)',
              color: isComparing ? theme.background : '#ffffff',
              transition: 'background-color 0.3s ease',
            }}
            onClick={(e) => { e.stopPropagation(); onCompare() }}
            aria-label="Compare destination"
            aria-pressed={isComparing}
            title="Compare"
          >
            <GitCompare size={11} />
          </button>
        </div>
      </div>
    </motion.div>
    </motion.div>
  )
}

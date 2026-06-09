'use client'

import { motion } from 'framer-motion'

/* ── Clickable item chip ── */
export function ItemChip({ label, accent, onClick, onPrefetch }: { label: string; accent: string; onClick: () => void; onPrefetch?: () => void }) {
  return (
    <motion.button
      onClick={onClick}
      onHoverStart={onPrefetch}
      className="text-xs px-3 py-1.5 rounded-full"
      style={{
        color: accent,
        backgroundColor: `color-mix(in srgb, ${accent} 10%, transparent)`,
        border: `1px solid color-mix(in srgb, ${accent} 22%, transparent)`,
      }}
      whileHover={{
        backgroundColor: accent,
        color: '#fff',
        scale: 1.04,
      }}
      whileTap={{ scale: 0.96 }}
      transition={{ duration: 0.18 }}
    >
      {label}
    </motion.button>
  )
}

/* ── Experience vibe chip (Best for) — subtler than ItemChip ── */
export function ExperienceChip({ label, onClick, onPrefetch }: { label: string; onClick: () => void; onPrefetch?: () => void }) {
  return (
    <motion.button
      onClick={onClick}
      onHoverStart={onPrefetch}
      className="text-xs px-3 py-1.5 rounded-full"
      style={{
        color: 'var(--color-subtle)',
        backgroundColor: 'color-mix(in srgb, var(--color-text) 5%, transparent)',
        border: '1px solid color-mix(in srgb, var(--color-text) 10%, transparent)',
      }}
      whileHover={{
        backgroundColor: 'color-mix(in srgb, var(--color-text) 12%, transparent)',
        color: 'var(--color-text)',
        scale: 1.04,
      }}
      whileTap={{ scale: 0.96 }}
      transition={{ duration: 0.18 }}
    >
      {label}
    </motion.button>
  )
}

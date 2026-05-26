'use client'

import { motion } from 'framer-motion'

export function TypingIndicator() {
  return (
    <div className="flex items-end gap-3 justify-start">
      {/* AI avatar */}
      <div
        className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
        style={{ backgroundColor: 'var(--color-accent)', color: 'var(--color-bg)' }}
      >
        W
      </div>

      <div
        className="px-4 py-3 rounded-2xl"
        style={{
          backgroundColor: 'var(--color-card-bg)',
          border: '1px solid color-mix(in srgb, var(--color-primary) 20%, transparent)',
          borderBottomLeftRadius: '4px',
        }}
      >
        <div className="flex gap-1 items-center h-5">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: 'var(--color-subtle)' }}
              animate={{ y: [0, -6, 0] }}
              transition={{
                duration: 0.6,
                delay: i * 0.15,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

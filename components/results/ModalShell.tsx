'use client'

import { motion } from 'framer-motion'
import { useDismissable } from '@/lib/useDismissable'

/* ── Shared modal shell ── */
export function ModalShell({ accent, onClose, children }: { accent: string; onClose: () => void; children: React.ReactNode }) {
  const dialogRef = useDismissable<HTMLDivElement>(onClose)
  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center p-6"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <div className="absolute inset-0" style={{ backgroundColor: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)' }} />
      <motion.div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        tabIndex={-1}
        className="relative rounded-3xl overflow-hidden flex flex-col z-10 w-full outline-none"
        style={{
          maxWidth: 560, maxHeight: '85vh',
          backgroundColor: 'var(--color-card-bg)',
          border: `1px solid color-mix(in srgb, ${accent} 28%, transparent)`,
          boxShadow: `0 0 60px color-mix(in srgb, ${accent} 22%, transparent), 0 24px 48px rgba(0,0,0,0.5)`,
        }}
        initial={{ scale: 0.88, y: 20, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        exit={{ scale: 0.9, y: 12, opacity: 0 }}
        transition={{ type: 'spring', damping: 22, stiffness: 300 }}
        onClick={e => e.stopPropagation()}
      >
        {children}
      </motion.div>
    </motion.div>
  )
}

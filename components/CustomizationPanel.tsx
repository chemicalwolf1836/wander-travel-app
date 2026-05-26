'use client'

import { useEffect, useState } from 'react'
import { useTheme } from 'next-themes'
import { AnimatePresence, motion } from 'framer-motion'
import { Sun, Moon, X } from 'lucide-react'
import type { AppSettings } from '@/types'

const STORAGE_KEY = 'wander_settings'

const ACCENT_SWATCHES = [
  '#F59E0B', // amber (default)
  '#60A5FA', // blue
  '#34D399', // emerald
  '#F472B6', // pink
  '#A78BFA', // purple
  '#FB923C', // orange
]

const DEFAULT_SETTINGS: AppSettings = {
  fontSize: 'default',
  cardLayout: 'grid',
  accentColor: '#F59E0B',
  mapStyle: 'default',
}

interface CustomizationPanelProps {
  open: boolean
  onClose: () => void
}

export function CustomizationPanel({ open, onClose }: CustomizationPanelProps) {
  const { theme, setTheme } = useTheme()
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      try {
        setSettings(JSON.parse(raw) as AppSettings)
      } catch {
        // ignore malformed storage
      }
    }
  }, [])

  function save(next: Partial<AppSettings>) {
    const updated = { ...settings, ...next }
    setSettings(updated)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))

    if (next.accentColor) {
      document.documentElement.style.setProperty('--color-accent', next.accentColor)
    }
    if (next.fontSize === 'large') {
      document.documentElement.style.fontSize = '18px'
    } else if (next.fontSize === 'default') {
      document.documentElement.style.fontSize = ''
    }
  }

  if (!mounted) return null

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}
          />

          {/* Panel */}
          <motion.div
            className="fixed right-0 top-0 bottom-0 z-50 w-80 overflow-y-auto"
            style={{
              backgroundColor: 'var(--color-card-bg)',
              borderLeft: '1px solid color-mix(in srgb, var(--color-primary) 30%, transparent)',
            }}
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-8">
                <h2
                  className="text-xl"
                  style={{ fontFamily: 'var(--font-playfair)', color: 'var(--color-text)' }}
                >
                  Settings
                </h2>
                <button onClick={onClose} style={{ color: 'var(--color-subtle)' }}>
                  <X size={18} />
                </button>
              </div>

              {/* Dark/light toggle */}
              <Section label="Appearance">
                <button
                  onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                  className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm"
                  style={{
                    backgroundColor: 'color-mix(in srgb, var(--color-primary) 15%, transparent)',
                    color: 'var(--color-text)',
                  }}
                >
                  <AnimatePresence mode="wait" initial={false}>
                    <motion.span
                      key={theme}
                      initial={{ rotate: -90, opacity: 0 }}
                      animate={{ rotate: 0, opacity: 1 }}
                      exit={{ rotate: 90, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
                    </motion.span>
                  </AnimatePresence>
                  {theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                </button>
              </Section>

              {/* Font size */}
              <Section label="Font Size">
                <div className="flex gap-2">
                  {(['default', 'large'] as const).map((size) => (
                    <button
                      key={size}
                      onClick={() => save({ fontSize: size })}
                      className="flex-1 py-2 rounded-lg text-sm capitalize"
                      style={{
                        backgroundColor:
                          settings.fontSize === size
                            ? 'var(--color-accent)'
                            : 'color-mix(in srgb, var(--color-primary) 15%, transparent)',
                        color: settings.fontSize === size ? 'var(--color-bg)' : 'var(--color-text)',
                      }}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </Section>

              {/* Card layout */}
              <Section label="Card Layout">
                <div className="flex gap-2">
                  {(['grid', 'list'] as const).map((layout) => (
                    <button
                      key={layout}
                      onClick={() => save({ cardLayout: layout })}
                      className="flex-1 py-2 rounded-lg text-sm capitalize"
                      style={{
                        backgroundColor:
                          settings.cardLayout === layout
                            ? 'var(--color-accent)'
                            : 'color-mix(in srgb, var(--color-primary) 15%, transparent)',
                        color: settings.cardLayout === layout ? 'var(--color-bg)' : 'var(--color-text)',
                      }}
                    >
                      {layout}
                    </button>
                  ))}
                </div>
              </Section>

              {/* Accent color */}
              <Section label="Accent Color">
                <div className="flex gap-3 flex-wrap">
                  {ACCENT_SWATCHES.map((color) => (
                    <button
                      key={color}
                      onClick={() => save({ accentColor: color })}
                      className="w-9 h-9 rounded-full transition-transform hover:scale-110"
                      style={{
                        backgroundColor: color,
                        outline: settings.accentColor === color ? `3px solid var(--color-text)` : 'none',
                        outlineOffset: '2px',
                      }}
                    />
                  ))}
                </div>
              </Section>

              {/* Map style */}
              <Section label="Map Style">
                <div className="flex flex-col gap-2">
                  {(['default', 'satellite', 'minimal'] as const).map((style) => (
                    <button
                      key={style}
                      onClick={() => save({ mapStyle: style })}
                      className="py-2 px-4 rounded-lg text-sm capitalize text-left"
                      style={{
                        backgroundColor:
                          settings.mapStyle === style
                            ? 'var(--color-accent)'
                            : 'color-mix(in srgb, var(--color-primary) 15%, transparent)',
                        color: settings.mapStyle === style ? 'var(--color-bg)' : 'var(--color-text)',
                      }}
                    >
                      {style}
                    </button>
                  ))}
                </div>
              </Section>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-6">
      <p className="text-xs uppercase tracking-widest mb-3" style={{ color: 'var(--color-subtle)' }}>
        {label}
      </p>
      {children}
    </div>
  )
}

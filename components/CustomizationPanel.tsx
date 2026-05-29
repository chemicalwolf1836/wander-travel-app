'use client'

import { useEffect, useRef, useState } from 'react'
import { useTheme } from 'next-themes'
import { AnimatePresence, motion } from 'framer-motion'
import { Sun, Moon, X } from 'lucide-react'
import type { AppSettings } from '@/types'
import { THEME_PRESETS, applyPreset } from '@/lib/themePresets'
import type { PresetName, AppThemePreset } from '@/lib/themePresets'

const STORAGE_KEY = 'wander_settings'

const DEFAULT_SETTINGS: AppSettings = {
  fontSize: 'default',
  cardLayout: 'grid',
  accentColor: '#F59E0B',
  mapStyle: 'default',
  presetName: 'midnight',
}

const MAP_STYLE_OPTIONS = [
  {
    value: 'default' as const,
    label: 'Default',
    icon: (
      <svg width="28" height="28" viewBox="0 0 32 32" fill="none">
        <rect x="2" y="2" width="28" height="28" rx="4" fill="currentColor" fillOpacity="0.12" />
        <line x1="2" y1="11" x2="30" y2="11" stroke="currentColor" strokeWidth="1.5" />
        <line x1="2" y1="21" x2="30" y2="21" stroke="currentColor" strokeWidth="1.5" />
        <line x1="11" y1="2" x2="11" y2="30" stroke="currentColor" strokeWidth="1.5" />
        <line x1="21" y1="2" x2="21" y2="30" stroke="currentColor" strokeWidth="1.5" />
      </svg>
    ),
  },
  {
    value: 'satellite' as const,
    label: 'Satellite',
    icon: (
      <svg width="28" height="28" viewBox="0 0 32 32" fill="none">
        <rect x="2" y="2" width="28" height="28" rx="4" fill="currentColor" fillOpacity="0.45" />
        <rect x="2" y="2" width="13" height="13" rx="3" fill="currentColor" fillOpacity="0.25" />
        <rect x="17" y="17" width="13" height="13" rx="3" fill="currentColor" fillOpacity="0.15" />
      </svg>
    ),
  },
  {
    value: 'minimal' as const,
    label: 'Minimal',
    icon: (
      <svg width="28" height="28" viewBox="0 0 32 32" fill="none">
        <circle cx="16" cy="16" r="7" stroke="currentColor" strokeWidth="2" />
        <circle cx="16" cy="16" r="2.5" fill="currentColor" />
      </svg>
    ),
  },
]

interface CustomizationPanelProps {
  open: boolean
  onClose: () => void
}

export function CustomizationPanel({ open, onClose }: CustomizationPanelProps) {
  const { theme, setTheme } = useTheme()
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS)
  const [mounted, setMounted] = useState(false)
  const colorInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setMounted(true)
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      try {
        const parsed = JSON.parse(raw) as AppSettings
        setSettings(parsed)
        if (parsed.presetName) applyPreset(parsed.presetName as PresetName)
        if (parsed.accentColor) document.documentElement.style.setProperty('--color-accent', parsed.accentColor)
        if (parsed.fontSize === 'large') document.documentElement.style.fontSize = '18px'
      } catch { /* ignore malformed storage */ }
    }
  }, [])

  function save(next: Partial<AppSettings>) {
    if (next.presetName) {
      applyPreset(next.presetName as PresetName)
      // Reset accent override to the preset's default so custom color doesn't bleed across
      if (!next.accentColor) {
        next.accentColor = THEME_PRESETS[next.presetName as PresetName]?.accent ?? settings.accentColor
      }
    }
    if (next.accentColor) {
      document.documentElement.style.setProperty('--color-accent', next.accentColor)
    }
    if (next.fontSize === 'large') {
      document.documentElement.style.fontSize = '18px'
    } else if (next.fontSize === 'default') {
      document.documentElement.style.fontSize = ''
    }

    const updated = { ...settings, ...next }
    setSettings(updated)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
    window.dispatchEvent(new CustomEvent('wander-settings', { detail: updated }))
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

              {/* Appearance */}
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

              {/* Theme presets */}
              <Section label="Theme">
                <div className="flex gap-2.5">
                  {(Object.entries(THEME_PRESETS) as [PresetName, AppThemePreset][]).map(([name, preset]) => (
                    <button
                      key={name}
                      onClick={() => save({ presetName: name })}
                      className="flex flex-col items-center gap-1.5"
                      title={preset.label}
                    >
                      <div
                        style={{
                          width: 44,
                          height: 60,
                          borderRadius: 10,
                          background: `linear-gradient(160deg, ${preset.card} 0%, ${preset.accent} 130%)`,
                          outline: settings.presetName === name
                            ? `2px solid ${preset.accent}`
                            : '2px solid transparent',
                          outlineOffset: 2,
                          transition: 'outline-color 0.2s ease',
                        }}
                      />
                      <span className="text-xs" style={{ color: 'var(--color-subtle)' }}>
                        {preset.label}
                      </span>
                    </button>
                  ))}
                </div>
              </Section>

              {/* Custom accent override */}
              <Section label="Accent">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <button
                      onClick={() => colorInputRef.current?.click()}
                      className="w-9 h-9 rounded-full border-2 transition-transform hover:scale-110"
                      style={{
                        backgroundColor: settings.accentColor,
                        borderColor: 'color-mix(in srgb, var(--color-text) 20%, transparent)',
                      }}
                      title="Pick custom accent color"
                    />
                    <input
                      ref={colorInputRef}
                      type="color"
                      value={settings.accentColor}
                      onChange={(e) => save({ accentColor: e.target.value })}
                      style={{ position: 'absolute', opacity: 0, width: 0, height: 0, top: 0, left: 0 }}
                      aria-hidden
                    />
                  </div>
                  <span className="text-xs font-mono opacity-60" style={{ color: 'var(--color-text)' }}>
                    {settings.accentColor}
                  </span>
                </div>
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
                        backgroundColor: settings.fontSize === size
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

              {/* Map style — visual thumbnail cards */}
              <Section label="Map Style">
                <div className="flex gap-2">
                  {MAP_STYLE_OPTIONS.map(({ value, label, icon }) => (
                    <button
                      key={value}
                      onClick={() => save({ mapStyle: value })}
                      className="flex flex-col items-center gap-2 flex-1 py-3 rounded-xl"
                      style={{
                        backgroundColor: 'color-mix(in srgb, var(--color-primary) 12%, transparent)',
                        border: `2px solid ${settings.mapStyle === value ? 'var(--color-accent)' : 'transparent'}`,
                        transition: 'border-color 0.2s ease',
                      }}
                    >
                      <div style={{ color: settings.mapStyle === value ? 'var(--color-accent)' : 'var(--color-subtle)' }}>
                        {icon}
                      </div>
                      <span className="text-xs capitalize" style={{ color: 'var(--color-text)' }}>
                        {label}
                      </span>
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

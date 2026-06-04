'use client'

import { useEffect, useRef, useState } from 'react'
import { useTheme } from 'next-themes'
import { AnimatePresence, motion } from 'framer-motion'
import { X } from 'lucide-react'
import type { AppSettings } from '@/types'
import { THEME_PRESETS, applyPreset, clearPresetStyles } from '@/lib/themePresets'
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
      <svg width="22" height="22" viewBox="0 0 32 32" fill="none">
        <rect x="2" y="2" width="28" height="28" rx="4" fill="currentColor" fillOpacity="0.12" />
        <line x1="2" y1="11" x2="30" y2="11" stroke="currentColor" strokeWidth="1.8" />
        <line x1="2" y1="21" x2="30" y2="21" stroke="currentColor" strokeWidth="1.8" />
        <line x1="11" y1="2" x2="11" y2="30" stroke="currentColor" strokeWidth="1.8" />
        <line x1="21" y1="2" x2="21" y2="30" stroke="currentColor" strokeWidth="1.8" />
      </svg>
    ),
  },
  {
    value: 'satellite' as const,
    label: 'Satellite',
    icon: (
      <svg width="22" height="22" viewBox="0 0 32 32" fill="none">
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
      <svg width="22" height="22" viewBox="0 0 32 32" fill="none">
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
  const isFirstRender = useRef(true)

  useEffect(() => {
    if (isFirstRender.current) { isFirstRender.current = false; return }
    clearPresetStyles()
    setSettings(prev => {
      const next = { ...prev, presetName: undefined }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      return next
    })
  }, [theme])

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

  const isDark = theme === 'dark'

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
            style={{ backgroundColor: 'rgba(0,0,0,0.45)' }}
          />

          {/* Panel */}
          <motion.div
            className="fixed right-0 top-0 bottom-0 z-50 w-72 overflow-y-auto"
            style={{
              backgroundColor: 'var(--color-card-bg)',
              borderLeft: '1px solid color-mix(in srgb, var(--color-primary) 20%, transparent)',
            }}
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
          >
            {/* Header */}
            <div
              className="flex items-center justify-between px-5 py-4 sticky top-0 z-10"
              style={{
                backgroundColor: 'var(--color-card-bg)',
                borderBottom: '1px solid color-mix(in srgb, var(--color-primary) 15%, transparent)',
              }}
            >
              <h2
                className="text-lg"
                style={{ fontFamily: 'var(--font-playfair)', color: 'var(--color-text)' }}
              >
                Personalize
              </h2>
              <button
                onClick={onClose}
                className="w-7 h-7 rounded-full flex items-center justify-center transition-opacity hover:opacity-70"
                style={{
                  backgroundColor: 'color-mix(in srgb, var(--color-text) 8%, transparent)',
                  color: 'var(--color-subtle)',
                }}
              >
                <X size={14} />
              </button>
            </div>

            <div className="px-5 py-5 flex flex-col gap-7">

              {/* Appearance */}
              <Section label="Appearance">
                <div className="flex items-center justify-between">
                  <span className="text-sm" style={{ color: 'var(--color-text)' }}>
                    {isDark ? 'Dark mode' : 'Light mode'}
                  </span>
                  {/* Toggle switch */}
                  <button
                    onClick={() => setTheme(isDark ? 'light' : 'dark')}
                    className="relative flex-shrink-0"
                    style={{ width: 44, height: 24 }}
                    aria-label="Toggle dark/light mode"
                  >
                    <div
                      className="absolute inset-0 rounded-full transition-colors duration-300"
                      style={{
                        backgroundColor: isDark
                          ? settings.accentColor
                          : 'color-mix(in srgb, var(--color-text) 20%, transparent)',
                      }}
                    />
                    <motion.div
                      className="absolute top-0.5 w-5 h-5 rounded-full"
                      style={{ backgroundColor: '#ffffff', boxShadow: '0 1px 4px rgba(0,0,0,0.3)' }}
                      animate={{ left: isDark ? 22 : 2 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                    />
                  </button>
                </div>
              </Section>

              {/* Theme presets */}
              <Section label="Theme">
                <div className="grid grid-cols-5 gap-2">
                  {(Object.entries(THEME_PRESETS) as [PresetName, AppThemePreset][]).map(([name, preset]) => {
                    const active = settings.presetName === name
                    return (
                      <button
                        key={name}
                        onClick={() => save({ presetName: name })}
                        className="flex flex-col items-center gap-1.5"
                        title={preset.label}
                      >
                        <div
                          style={{
                            width: '100%',
                            aspectRatio: '1',
                            borderRadius: 12,
                            background: `linear-gradient(145deg, ${preset.card} 0%, ${preset.accent} 130%)`,
                            outline: active ? `2px solid ${preset.accent}` : '2px solid transparent',
                            outlineOffset: 3,
                            transition: 'outline-color 0.2s ease, box-shadow 0.2s ease',
                            boxShadow: active ? `0 0 10px color-mix(in srgb, ${preset.accent} 45%, transparent)` : 'none',
                          }}
                        />
                        <span className="text-xs truncate w-full text-center" style={{ color: active ? 'var(--color-text)' : 'var(--color-subtle)', fontSize: 10 }}>
                          {preset.label}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </Section>

              {/* Accent colour */}
              <Section label="Accent colour">
                {/* Quick-pick presets */}
                <div className="flex gap-2 mb-3">
                  {['#F59E0B', '#EF4444', '#EC4899', '#8B5CF6', '#06B6D4', '#10B981', '#F97316'].map(color => (
                    <button
                      key={color}
                      onClick={() => save({ accentColor: color })}
                      className="transition-transform hover:scale-110"
                      style={{
                        width: 24,
                        height: 24,
                        borderRadius: '50%',
                        backgroundColor: color,
                        outline: settings.accentColor.toLowerCase() === color.toLowerCase()
                          ? `2px solid ${color}`
                          : '2px solid transparent',
                        outlineOffset: 2,
                        flexShrink: 0,
                      }}
                      title={color}
                    />
                  ))}
                </div>
                {/* Custom picker row */}
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => colorInputRef.current?.click()}
                    className="relative flex-shrink-0 transition-transform hover:scale-110"
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: '50%',
                      backgroundColor: settings.accentColor,
                      boxShadow: `0 0 0 2px var(--color-card-bg), 0 0 0 3.5px color-mix(in srgb, ${settings.accentColor} 60%, transparent)`,
                    }}
                    title="Custom colour"
                  >
                    <input
                      ref={colorInputRef}
                      type="color"
                      value={settings.accentColor}
                      onChange={(e) => save({ accentColor: e.target.value })}
                      style={{ position: 'absolute', opacity: 0, width: 0, height: 0, top: 0, left: 0 }}
                      aria-hidden
                    />
                  </button>
                  <span className="text-xs font-mono" style={{ color: 'var(--color-subtle)' }}>
                    {settings.accentColor.toUpperCase()}
                  </span>
                  <span className="text-xs" style={{ color: 'var(--color-subtle)', opacity: 0.6 }}>Custom</span>
                </div>
              </Section>

              {/* Font size — segmented control with Aa preview */}
              <Section label="Font size">
                <div
                  className="flex gap-1 p-1 rounded-xl"
                  style={{ backgroundColor: 'color-mix(in srgb, var(--color-primary) 12%, transparent)' }}
                >
                  {([
                    { key: 'default', label: 'Normal', size: 13 },
                    { key: 'large', label: 'Large', size: 17 },
                  ] as const).map(({ key, label, size }) => {
                    const active = settings.fontSize === key
                    return (
                      <button
                        key={key}
                        onClick={() => save({ fontSize: key })}
                        className="flex-1 flex flex-col items-center py-2 rounded-lg transition-all gap-0.5"
                        style={{
                          backgroundColor: active ? settings.accentColor : 'transparent',
                          color: active ? '#fff' : 'var(--color-subtle)',
                        }}
                      >
                        <span style={{ fontSize: size, fontFamily: 'var(--font-playfair)', lineHeight: 1 }}>Aa</span>
                        <span style={{ fontSize: 10 }}>{label}</span>
                      </button>
                    )
                  })}
                </div>
              </Section>

              {/* Map style */}
              <Section label="Map style">
                <div className="grid grid-cols-3 gap-2">
                  {MAP_STYLE_OPTIONS.map(({ value, label, icon }) => {
                    const active = settings.mapStyle === value
                    return (
                      <button
                        key={value}
                        onClick={() => save({ mapStyle: value })}
                        className="flex flex-col items-center gap-2 py-3 rounded-xl transition-all"
                        style={{
                          backgroundColor: active
                            ? 'color-mix(in srgb, var(--color-accent) 10%, transparent)'
                            : 'color-mix(in srgb, var(--color-primary) 10%, transparent)',
                          border: `1.5px solid ${active ? settings.accentColor : 'transparent'}`,
                          boxShadow: active
                            ? `0 0 12px color-mix(in srgb, ${settings.accentColor} 20%, transparent)`
                            : 'none',
                        }}
                      >
                        <div style={{ color: active ? settings.accentColor : 'var(--color-subtle)' }}>
                          {icon}
                        </div>
                        <span
                          className="text-xs"
                          style={{ color: active ? 'var(--color-text)' : 'var(--color-subtle)', fontWeight: active ? 500 : 400 }}
                        >
                          {label}
                        </span>
                      </button>
                    )
                  })}
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
    <div>
      <div className="flex items-center gap-3 mb-3">
        <p className="text-xs font-medium uppercase tracking-widest flex-shrink-0" style={{ color: 'var(--color-subtle)' }}>
          {label}
        </p>
        <div className="flex-1" style={{ height: 1, backgroundColor: 'color-mix(in srgb, var(--color-text) 6%, transparent)' }} />
      </div>
      {children}
    </div>
  )
}

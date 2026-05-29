export type PresetName = 'midnight' | 'desert' | 'arctic' | 'jungle' | 'dusk'

export interface AppThemePreset {
  label: string
  bg: string
  card: string
  text: string
  subtle: string
  accent: string
  primary: string
}

export const THEME_PRESETS: Record<PresetName, AppThemePreset> = {
  midnight: { label: 'Midnight', bg: '#0a0f1e', card: '#111827', text: '#f0f4ff', subtle: '#6b7a99', accent: '#F59E0B', primary: '#1B2B4B' },
  desert:   { label: 'Desert',   bg: '#f5f0e8', card: '#ffffff', text: '#2d1a0e', subtle: '#8b6b4a', accent: '#d97706', primary: '#7a3c1a' },
  arctic:   { label: 'Arctic',   bg: '#0f1923', card: '#162232', text: '#e8f4fd', subtle: '#7a9ab5', accent: '#38bdf8', primary: '#1B3A5C' },
  jungle:   { label: 'Jungle',   bg: '#0a1a0f', card: '#0f2318', text: '#e8f5ec', subtle: '#5a8a6a', accent: '#10b981', primary: '#1a3a28' },
  dusk:     { label: 'Dusk',     bg: '#110d1a', card: '#1c1528', text: '#f0ecff', subtle: '#8b7aaa', accent: '#8b5cf6', primary: '#2a1a4a' },
}

const PRESET_VARS = ['--color-bg', '--color-card-bg', '--color-text', '--color-subtle', '--color-accent', '--color-primary'] as const

export function applyPreset(name: PresetName): void {
  const preset = THEME_PRESETS[name]
  if (!preset) return
  const root = document.documentElement
  root.style.setProperty('--color-bg', preset.bg)
  root.style.setProperty('--color-card-bg', preset.card)
  root.style.setProperty('--color-text', preset.text)
  root.style.setProperty('--color-subtle', preset.subtle)
  root.style.setProperty('--color-accent', preset.accent)
  root.style.setProperty('--color-primary', preset.primary)
}

export function clearPresetStyles(): void {
  const root = document.documentElement
  PRESET_VARS.forEach(v => root.style.removeProperty(v))
}

import type { CulturalTheme } from '@/types'
import { weatherModifiers } from './themes'

// Writes cultural theme + weather modifier into CSS custom properties on :root.
// The 600ms transition is handled by CSS transition rules in globals.css.
export function applyTheme(theme: CulturalTheme, weatherCondition?: string): void {
  const root = document.documentElement

  root.style.setProperty('--color-primary', theme.primary)
  root.style.setProperty('--color-accent', theme.accent)
  root.style.setProperty('--color-bg', theme.background)
  root.style.setProperty('--color-card-bg', theme.cardBg)
  root.style.setProperty('--color-text', theme.text)

  const filter = weatherCondition ? (weatherModifiers[weatherCondition] ?? '') : ''
  root.style.setProperty('--weather-filter', filter)
}

export function resetTheme(): void {
  const root = document.documentElement
  root.style.removeProperty('--color-primary')
  root.style.removeProperty('--color-accent')
  root.style.removeProperty('--color-bg')
  root.style.removeProperty('--color-card-bg')
  root.style.removeProperty('--color-text')
  root.style.removeProperty('--weather-filter')
}

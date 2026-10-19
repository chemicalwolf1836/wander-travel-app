import type { CulturalTheme } from '@/types'
import { weatherModifiers } from './themes'
import { mixHex, readableOn, textOn } from './contrast'

// Writes cultural theme + weather modifier into CSS custom properties on :root.
// The 600ms transition is handled by CSS transition rules in globals.css.
export function applyTheme(theme: CulturalTheme, weatherCondition?: string): void {
  const root = document.documentElement

  root.style.setProperty('--color-primary', theme.primary)
  root.style.setProperty('--color-accent', theme.accent)
  root.style.setProperty('--color-bg', theme.background)
  root.style.setProperty('--color-card-bg', theme.cardBg)
  root.style.setProperty('--color-text', theme.text)
  // Destination colours come from the AI, so derive the text tokens from them
  // and nudge each until it reads on this theme's own background and cards.
  const accentText = readableOn(readableOn(theme.accent, theme.cardBg), theme.background)
  root.style.setProperty('--color-accent-text', accentText)
  root.style.setProperty('--color-on-accent', textOn(theme.accent))
  root.style.setProperty('--color-subtle', readableOn(readableOn(mixHex(theme.text, theme.background, 0.62), theme.cardBg), theme.background))

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
  root.style.removeProperty('--color-accent-text')
  root.style.removeProperty('--color-on-accent')
  root.style.removeProperty('--color-subtle')
  root.style.removeProperty('--weather-filter')
}

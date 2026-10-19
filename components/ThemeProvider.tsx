'use client'

import { ThemeProvider as NextThemesProvider, useTheme } from 'next-themes'
import { MotionConfig } from 'framer-motion'
import { Toaster } from 'sonner'
import type { ReactNode } from 'react'
import { SyncProvider } from './SyncProvider'

interface ThemeProviderProps {
  children: ReactNode
}

// Wraps next-themes so dark/light mode preference persists across page loads.
// The attribute="class" tells next-themes to toggle a "dark" class on <html>,
// which is how Tailwind and shadcn detect dark mode.
// MotionConfig honours the OS "reduce motion" setting for every framer-motion
// animation in the app (transform/layout animations are skipped).
export function ThemeProvider({ children }: ThemeProviderProps) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem={false}
      disableTransitionOnChange={false}
    >
      <MotionConfig reducedMotion="user">
        <SyncProvider>{children}</SyncProvider>
      </MotionConfig>
    </NextThemesProvider>
  )
}

// Toasts follow the app's dark/light mode instead of always rendering light.
export function ThemedToaster() {
  const { resolvedTheme } = useTheme()
  return (
    <Toaster
      position="bottom-right"
      richColors
      closeButton
      theme={resolvedTheme === 'light' ? 'light' : 'dark'}
    />
  )
}

'use client'

import Link from 'next/link'
import { useTheme } from 'next-themes'
import { usePathname } from 'next/navigation'
import { Sun, Moon, Menu, ArrowLeft, Heart } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useState, useEffect } from 'react'
import { clearPresetStyles } from '@/lib/themePresets'

interface NavbarProps {
  onSettingsOpen?: () => void
  onBack?: () => void
}

export function Navbar({ onSettingsOpen, onBack }: NavbarProps) {
  const { theme, setTheme } = useTheme()
  const pathname = usePathname()
  const [mounted, setMounted] = useState(false)
  const [savedCount, setSavedCount] = useState(0)
  const isDestinationPage = pathname.startsWith('/destination/')

  useEffect(() => {
    setMounted(true)
    try {
      const raw = localStorage.getItem('wander_favourites')
      const favs = raw ? (JSON.parse(raw) as unknown[]) : []
      setSavedCount(Array.isArray(favs) ? favs.length : 0)
    } catch { /* ignore */ }

    function onFavsChanged(e: Event) {
      setSavedCount((e as CustomEvent<{ count: number }>).detail.count)
    }
    window.addEventListener('wander-favourites-changed', onFavsChanged)
    return () => window.removeEventListener('wander-favourites-changed', onFavsChanged)
  }, [])

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4 backdrop-blur-md border-b"
      style={{
        backgroundColor: 'color-mix(in srgb, var(--color-bg) 80%, transparent)',
        borderColor: 'color-mix(in srgb, var(--color-primary) 30%, transparent)',
        transition: 'background-color 600ms ease-in-out, border-color 600ms ease-in-out',
      }}
    >
      {/* Left: back button on destination page, logo otherwise */}
      <div className="flex items-center gap-3">
        {isDestinationPage && onBack ? (
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-sm opacity-80 hover:opacity-100 transition-opacity"
            style={{ color: 'var(--color-text)' }}
          >
            <ArrowLeft size={16} />
            Back to Destinations
          </button>
        ) : (
          <Link href="/" className="flex items-center gap-2">
            <span
              className="text-2xl tracking-tight"
              style={{ fontFamily: 'var(--font-playfair)', color: 'var(--color-text)' }}
            >
              Wander
            </span>
          </Link>
        )}
      </div>

      {/* Right: saved link + dark/light toggle + settings */}
      <div className="flex items-center gap-3">
        <Link
          href="/saved"
          className="relative p-2 rounded-full hover:opacity-70 transition-opacity"
          style={{ color: 'var(--color-text)' }}
          aria-label="Saved destinations"
        >
          <Heart size={18} />
          {savedCount > 0 && (
            <span
              className="absolute top-1.5 right-1.5 block rounded-full"
              style={{
                width: 6,
                height: 6,
                backgroundColor: 'var(--color-accent)',
                boxShadow: '0 0 4px var(--color-accent)',
              }}
              aria-hidden="true"
            />
          )}
        </Link>

        {mounted && (
          <button
            onClick={() => {
              clearPresetStyles()
              try {
                const raw = localStorage.getItem('wander_settings')
                if (raw) {
                  const s = JSON.parse(raw)
                  delete s.presetName
                  localStorage.setItem('wander_settings', JSON.stringify(s))
                }
              } catch { /* ignore */ }
              setTheme(theme === 'dark' ? 'light' : 'dark')
            }}
            className="p-2 rounded-full hover:opacity-70 transition-opacity"
            style={{ color: 'var(--color-text)' }}
            aria-label="Toggle dark/light mode"
          >
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={theme}
                initial={{ rotate: -90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: 90, opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
              </motion.div>
            </AnimatePresence>
          </button>
        )}

        {onSettingsOpen && (
          <button
            onClick={onSettingsOpen}
            className="p-2 rounded-full hover:opacity-70 transition-opacity"
            style={{ color: 'var(--color-text)' }}
            aria-label="Open personalize panel"
          >
            <Menu size={18} />
          </button>
        )}
      </div>
    </nav>
  )
}

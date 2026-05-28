'use client'

import Link from 'next/link'
import { useTheme } from 'next-themes'
import { usePathname } from 'next/navigation'
import { Sun, Moon, Menu, ArrowLeft, Heart } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useState, useEffect } from 'react'

interface NavbarProps {
  onSettingsOpen?: () => void
  onBack?: () => void
}

export function Navbar({ onSettingsOpen, onBack }: NavbarProps) {
  const { theme, setTheme } = useTheme()
  const pathname = usePathname()
  const [mounted, setMounted] = useState(false)
  const isDestinationPage = pathname.startsWith('/destination/')

  // Avoid hydration mismatch - only show theme toggle after mount
  useEffect(() => { setMounted(true) }, [])

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
          className="p-2 rounded-full hover:opacity-70 transition-opacity"
          style={{ color: 'var(--color-text)' }}
          aria-label="Saved destinations"
        >
          <Heart size={18} />
        </Link>

        {mounted && (
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
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
            aria-label="Open settings"
          >
            <Menu size={18} />
          </button>
        )}
      </div>
    </nav>
  )
}

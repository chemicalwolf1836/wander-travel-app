'use client'

import Link from 'next/link'
import { useTheme } from 'next-themes'
import { usePathname } from 'next/navigation'
import { Sun, Moon, Menu, ArrowLeft, Heart, Compass } from 'lucide-react'
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
      className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 sm:px-6 py-3 backdrop-blur-md border-b"
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

      {/* Right: primary links + dark/light toggle + settings */}
      <div className="flex items-center gap-1 sm:gap-2">
        <NavLink href="/discover" label="Discover" active={pathname === '/discover'}>
          <Compass size={18} />
        </NavLink>

        <NavLink
          href="/saved"
          label="Saved"
          ariaLabel={savedCount > 0 ? `Saved destinations (${savedCount})` : 'Saved destinations'}
          active={pathname === '/saved'}
        >
          <Heart size={18} />
          {savedCount > 0 && (
            <span
              className="absolute -top-0.5 -right-0.5 sm:static flex items-center justify-center rounded-full text-[10px] font-semibold leading-none sm:order-last"
              style={{
                minWidth: 18,
                height: 18,
                padding: '0 5px',
                backgroundColor: 'var(--color-accent)',
                color: 'var(--color-bg)',
              }}
              aria-hidden="true"
            >
              {savedCount > 99 ? '99+' : savedCount}
            </span>
          )}
        </NavLink>

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
            className="w-11 h-11 flex items-center justify-center rounded-full hover:opacity-70 transition-opacity"
            style={{ color: 'var(--color-text)' }}
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
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
            className="w-11 h-11 flex items-center justify-center rounded-full hover:opacity-70 transition-opacity"
            style={{ color: 'var(--color-text)' }}
            aria-label="Open personalise panel"
          >
            <Menu size={18} />
          </button>
        )}
      </div>
    </nav>
  )
}

// Icon-only on phones, icon + label from sm up. Highlights the current page.
function NavLink({ href, label, ariaLabel, active, children }: {
  href: string
  label: string
  ariaLabel?: string
  active: boolean
  children: React.ReactNode
}) {
  return (
    <Link
      href={href}
      aria-label={ariaLabel ?? label}
      aria-current={active ? 'page' : undefined}
      className="relative flex items-center justify-center gap-2 min-w-11 h-11 sm:px-4 rounded-full text-sm transition-colors hover:bg-[color-mix(in_srgb,var(--color-text)_8%,transparent)]"
      style={{
        color: 'var(--color-text)',
        backgroundColor: active ? 'color-mix(in srgb, var(--color-accent) 14%, transparent)' : undefined,
      }}
    >
      {children}
      <span className="hidden sm:inline">{label}</span>
    </Link>
  )
}

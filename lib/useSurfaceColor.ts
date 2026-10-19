'use client'

import { useEffect, useState } from 'react'

// The resolved value of a colour custom property on :root (e.g. --color-card-bg),
// kept current as the light/dark class, a theme preset or a destination theme
// rewrites it. Lets components check accent text against the real surface.
export function useSurfaceColor(variable = '--color-card-bg', fallback = '#111827'): string {
  const [color, setColor] = useState(fallback)

  useEffect(() => {
    const root = document.documentElement
    const read = () => {
      const v = getComputedStyle(root).getPropertyValue(variable).trim()
      if (v) setColor(v)
    }
    read()
    const observer = new MutationObserver(read)
    observer.observe(root, { attributes: true, attributeFilter: ['class', 'style'] })
    return () => observer.disconnect()
  }, [variable])

  return color
}

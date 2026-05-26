'use client'

import { motion } from 'framer-motion'
import { ComposableMap, Geographies, Geography, Marker } from 'react-simple-maps'
import type { Destination } from '@/types'

const GEO_URL = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json'

interface WorldMapProps {
  destinations: Destination[]
  activeIndex: number
  onPinClick: (index: number) => void
  exiting?: boolean
}

const RING_COUNT = 22

export function WorldMap({ destinations, activeIndex, onPinClick, exiting }: WorldMapProps) {
  return (
    <motion.div
      className="relative w-full h-full"
      initial={{ opacity: 0 }}
      animate={{ opacity: exiting ? 0 : 1 }}
      transition={{ duration: 0.6, ease: 'easeInOut' }}
    >
      {/* Concentric rings - decorative overlay centered slightly right to suggest Middle East radiance */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <svg width="100%" height="100%">
          {Array.from({ length: RING_COUNT }).map((_, i) => (
            <circle
              key={i}
              cx="54%"
              cy="44%"
              r={`${(i + 1) * 4.2}%`}
              fill="none"
              stroke="var(--color-text)"
              strokeWidth="0.4"
              opacity={0.06 - i * 0.002}
            />
          ))}
        </svg>
      </div>

      <ComposableMap
        projectionConfig={{ scale: 155, center: [0, 10] }}
        style={{ width: '100%', height: '100%' }}
      >
        <defs>
          {/* Dot halftone pattern - small uniform dots */}
          <pattern
            id="halftone"
            x="0"
            y="0"
            width="6"
            height="6"
            patternUnits="userSpaceOnUse"
          >
            <circle cx="3" cy="3" r="1.4" fill="var(--color-text)" opacity="0.45" />
          </pattern>

          {/* Slightly larger dots for active destination highlight */}
          <pattern
            id="halftone-active"
            x="0"
            y="0"
            width="6"
            height="6"
            patternUnits="userSpaceOnUse"
          >
            <circle cx="3" cy="3" r="1.8" fill="var(--color-accent)" opacity="0.6" />
          </pattern>
        </defs>

        <Geographies geography={GEO_URL}>
          {({ geographies }: { geographies: Array<{ rsmKey: string }> }) =>
            geographies.map((geo) => (
              <Geography
                key={geo.rsmKey}
                geography={geo}
                style={{
                  default: {
                    fill: 'url(#halftone)',
                    stroke: 'none',
                    outline: 'none',
                  },
                  hover: {
                    fill: 'url(#halftone)',
                    stroke: 'none',
                    outline: 'none',
                  },
                  pressed: { outline: 'none' },
                }}
              />
            ))
          }
        </Geographies>

        {/* Destination markers */}
        {destinations.map((dest, i) => {
          const isActive = activeIndex === i
          return (
            <Marker
              key={dest.city}
              coordinates={[dest.coordinates.lng, dest.coordinates.lat]}
              onClick={() => onPinClick(i)}
              style={{ cursor: 'pointer' }}
            >
              {/* Outer pulse ring */}
              <motion.circle
                r={0}
                fill="none"
                stroke={dest.culturalTheme.accent}
                strokeWidth={1.5}
                animate={isActive ? { r: [6, 18], opacity: [0.6, 0] } : { r: 0, opacity: 0 }}
                transition={{ duration: 1.6, repeat: Infinity, ease: 'easeOut' }}
              />
              {/* Inner glow */}
              <motion.circle
                r={isActive ? 5 : 3.5}
                fill={dest.culturalTheme.accent}
                animate={{ r: isActive ? 5 : 3.5 }}
                transition={{ duration: 0.3 }}
                style={{
                  filter: `drop-shadow(0 0 ${isActive ? 8 : 3}px ${dest.culturalTheme.accent})`,
                }}
              />
              {/* City label */}
              <motion.text
                textAnchor="middle"
                y={isActive ? -12 : -10}
                style={{
                  fontFamily: 'var(--font-dm-sans), sans-serif',
                  fontSize: isActive ? '8px' : '7px',
                  fill: isActive ? dest.culturalTheme.accent : 'var(--color-subtle)',
                  fontWeight: isActive ? 600 : 400,
                  pointerEvents: 'none',
                  letterSpacing: '0.03em',
                }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.15 + 0.4 }}
              >
                {dest.flagEmoji} {dest.city}
              </motion.text>
            </Marker>
          )
        })}
      </ComposableMap>
    </motion.div>
  )
}

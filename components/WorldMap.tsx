'use client'

import { motion } from 'framer-motion'
import { ComposableMap, Geographies, Geography, Marker, ZoomableGroup } from 'react-simple-maps'
import type { Destination } from '@/types'

const GEO_URL = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json'

interface WorldMapProps {
  destinations: Destination[]
  activeIndex: number
  onPinClick: (index: number) => void
  exiting?: boolean
}

export function WorldMap({ destinations, activeIndex, onPinClick, exiting }: WorldMapProps) {
  return (
    <motion.div
      className="w-full h-full"
      initial={{ opacity: 0 }}
      animate={{ opacity: exiting ? 0 : 1 }}
      transition={{ duration: 0.6, ease: 'easeInOut' }}
    >
      <ComposableMap
        projectionConfig={{ scale: 160, center: [0, 10] }}
        style={{ width: '100%', height: '100%' }}
      >
        <ZoomableGroup zoom={1} minZoom={0.8} maxZoom={4}>
          <Geographies geography={GEO_URL}>
            {({ geographies }) =>
              geographies.map((geo) => (
                <Geography
                  key={geo.rsmKey}
                  geography={geo}
                  style={{
                    default: {
                      fill: 'color-mix(in srgb, var(--color-primary) 18%, transparent)',
                      stroke: 'color-mix(in srgb, var(--color-primary) 40%, transparent)',
                      strokeWidth: 0.4,
                      outline: 'none',
                    },
                    hover: {
                      fill: 'color-mix(in srgb, var(--color-accent) 20%, transparent)',
                      stroke: 'color-mix(in srgb, var(--color-accent) 50%, transparent)',
                      strokeWidth: 0.4,
                      outline: 'none',
                    },
                    pressed: { outline: 'none' },
                  }}
                />
              ))
            }
          </Geographies>

          {destinations.map((dest, i) => {
            const isActive = activeIndex === i
            return (
              <Marker
                key={dest.city}
                coordinates={[dest.coordinates.lng, dest.coordinates.lat]}
                onClick={() => onPinClick(i)}
                style={{ cursor: 'pointer' }}
              >
                {/* Pulse ring */}
                <motion.circle
                  r={isActive ? 16 : 10}
                  fill="none"
                  stroke={dest.culturalTheme.accent}
                  strokeWidth={1}
                  opacity={isActive ? 0.4 : 0.2}
                  animate={{ r: isActive ? [10, 20, 10] : 10, opacity: isActive ? [0.4, 0.1, 0.4] : 0.2 }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                />
                {/* Dot */}
                <motion.circle
                  r={isActive ? 6 : 4}
                  fill={dest.culturalTheme.accent}
                  animate={{ r: isActive ? 6 : 4 }}
                  transition={{ duration: 0.3 }}
                  style={{ filter: isActive ? `drop-shadow(0 0 6px ${dest.culturalTheme.accent})` : 'none' }}
                />
                {/* City label */}
                <motion.text
                  textAnchor="middle"
                  y={-14}
                  style={{
                    fontFamily: 'var(--font-dm-sans)',
                    fontSize: isActive ? '9px' : '7px',
                    fill: isActive ? dest.culturalTheme.accent : 'var(--color-subtle)',
                    pointerEvents: 'none',
                    fontWeight: isActive ? 600 : 400,
                  }}
                  animate={{ opacity: 1 }}
                  initial={{ opacity: 0 }}
                  transition={{ delay: i * 0.2 + 0.5 }}
                >
                  {dest.flagEmoji} {dest.city}
                </motion.text>
              </Marker>
            )
          })}
        </ZoomableGroup>
      </ComposableMap>
    </motion.div>
  )
}

'use client'

import { useRef, useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Globe, { type GlobeMethods } from 'react-globe.gl'
import type { Destination } from '@/types'

interface GlobeInnerProps {
  destinations: Destination[]
  activeIndex: number
  onPinClick: (index: number) => void
  exiting?: boolean
}

interface GlobePoint {
  lat: number
  lng: number
  label: string
  color: string
  destinationIndex: number
}

export default function GlobeInner({ destinations, activeIndex, onPinClick, exiting }: GlobeInnerProps) {
  const globeRef = useRef<GlobeMethods | undefined>(undefined)
  const [points, setPoints] = useState<GlobePoint[]>([])

  useEffect(() => {
    setPoints(
      destinations.map((d, i) => ({
        lat: d.coordinates.lat,
        lng: d.coordinates.lng,
        label: `${d.flagEmoji} ${d.city}`,
        color: d.culturalTheme.accent,
        destinationIndex: i,
      }))
    )
  }, [destinations])

  // Rotate globe to face active destination
  useEffect(() => {
    const active = destinations[activeIndex]
    if (active && globeRef.current) {
      globeRef.current.pointOfView(
        { lat: active.coordinates.lat, lng: active.coordinates.lng, altitude: 2.2 },
        800
      )
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeIndex, destinations])

  return (
    <AnimatePresence>
      {!exiting && (
        <motion.div
          className="w-full h-full"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.4, opacity: 0 }}
          transition={{ duration: 0.6, ease: 'easeInOut' }}
        >
          <Globe
            ref={globeRef}
            globeImageUrl="//unpkg.com/three-globe/example/img/earth-night.jpg"
            backgroundColor="rgba(0,0,0,0)"
            pointsData={points}
            pointLat="lat"
            pointLng="lng"
            pointColor="color"
            pointAltitude={0.04}
            pointRadius={0.5}
            pointLabel="label"
            onPointClick={(point: object) => {
              const p = point as GlobePoint
              onPinClick(p.destinationIndex)
            }}
            atmosphereColor="rgba(100,150,255,0.3)"
            atmosphereAltitude={0.15}
            animateIn={true}
          />
        </motion.div>
      )}
    </AnimatePresence>
  )
}

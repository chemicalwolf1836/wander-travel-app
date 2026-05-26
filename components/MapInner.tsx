'use client'

import { useRef, useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'

interface MapInnerProps {
  lat: number
  lng: number
  cityName: string
  darkMode: boolean
  onFlyComplete: () => void
}

export default function MapInner({ lat, lng, cityName, darkMode, onFlyComplete }: MapInnerProps) {
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<mapboxgl.Map | null>(null)
  const [styleReady, setStyleReady] = useState(false)

  useEffect(() => {
    mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? ''

    if (!mapContainer.current || map.current) return

    const initialStyle = darkMode
      ? 'mapbox://styles/mapbox/dark-v11'
      : 'mapbox://styles/mapbox/light-v11'

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: initialStyle,
      center: [lng, lat],
      zoom: 2,
      pitch: 0,
      bearing: 0,
      interactive: false,
    })

    map.current.on('load', () => {
      setStyleReady(true)

      // Switch to satellite and fly in
      map.current?.setStyle('mapbox://styles/mapbox/satellite-streets-v12')

      map.current?.once('style.load', () => {
        map.current?.flyTo({
          center: [lng, lat],
          zoom: 13,
          pitch: 55,
          bearing: -15,
          duration: 4500,
          essential: true,
        })

        map.current?.once('moveend', () => {
          onFlyComplete()
        })
      })
    })

    return () => {
      map.current?.remove()
      map.current = null
    }
    // Only run once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="relative w-full h-full">
      <div ref={mapContainer} className="w-full h-full" />

      {/* Cinematic overlay - fades out during flyTo */}
      {!styleReady && (
        <motion.div
          className="absolute inset-0 flex flex-col items-center justify-center"
          style={{ backgroundColor: 'var(--color-bg)' }}
          animate={{ opacity: styleReady ? 0 : 1 }}
          transition={{ duration: 1 }}
        >
          <p
            className="text-4xl md:text-6xl"
            style={{ fontFamily: 'var(--font-playfair)', color: 'var(--color-text)' }}
          >
            {cityName}
          </p>
          <div className="mt-4 w-8 h-8 border-2 border-t-transparent rounded-full animate-spin"
            style={{ borderColor: 'var(--color-accent)' }} />
        </motion.div>
      )}
    </div>
  )
}

'use client'

import { useEffect, useRef, useState } from 'react'
import { useTheme } from 'next-themes'
import { motion } from 'framer-motion'
import { ComposableMap, Geographies, Geography, Marker } from 'react-simple-maps'
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { Graticule, Sphere } = require('react-simple-maps') as {
  Graticule: React.ComponentType<{ stroke?: string; strokeWidth?: number }>
  Sphere: React.ComponentType<{ id: string; fill?: string; stroke?: string; strokeWidth?: number }>
}
import React from 'react'
import type { Destination } from '@/types'

const GEO_URL = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json'

const ISO_NUMERIC: Record<string, string> = {
  AF:'4',AL:'8',DZ:'12',AO:'24',AR:'32',AM:'51',AU:'36',AT:'40',AZ:'31',
  BS:'44',BH:'48',BD:'50',BB:'52',BY:'112',BE:'56',BZ:'84',BJ:'204',BT:'64',
  BO:'68',BA:'70',BW:'72',BR:'76',BN:'96',BG:'100',BF:'854',BI:'108',
  KH:'116',CM:'120',CA:'124',CV:'132',CF:'140',TD:'148',CL:'152',CN:'156',
  CO:'170',KM:'174',CG:'178',CD:'180',CR:'188',CI:'384',HR:'191',CU:'192',
  CY:'196',CZ:'203',DK:'208',DJ:'262',DO:'214',EC:'218',EG:'818',SV:'222',
  GQ:'226',ER:'232',EE:'233',ET:'231',FJ:'242',FI:'246',FR:'250',GA:'266',
  GM:'270',GE:'268',DE:'276',GH:'288',GR:'300',GT:'320',GN:'324',GW:'624',
  GY:'328',HT:'332',HN:'340',HU:'348',IS:'352',IN:'356',ID:'360',IR:'364',
  IQ:'368',IE:'372',IL:'376',IT:'380',JM:'388',JP:'392',JO:'400',KZ:'398',
  KE:'404',KP:'408',KR:'410',KW:'414',KG:'417',LA:'418',LV:'428',LB:'422',
  LS:'426',LR:'430',LY:'434',LI:'438',LT:'440',LU:'442',MG:'450',MW:'454',
  MY:'458',MV:'462',ML:'466',MT:'470',MR:'478',MU:'480',MX:'484',MD:'498',
  MN:'496',ME:'499',MA:'504',MZ:'508',MM:'104',NA:'516',NP:'524',NL:'528',
  NZ:'554',NI:'558',NE:'562',NG:'566',NO:'578',OM:'512',PK:'586',PW:'585',
  PA:'591',PG:'598',PY:'600',PE:'604',PH:'608',PL:'616',PT:'620',QA:'634',
  RO:'642',RU:'643',RW:'646',SA:'682',SN:'686',RS:'688',SL:'694',SG:'702',
  SK:'703',SI:'705',SO:'706',ZA:'710',SS:'728',ES:'724',LK:'144',SD:'729',
  SR:'740',SZ:'748',SE:'752',CH:'756',SY:'760',TJ:'762',TZ:'834',TH:'764',
  TL:'626',TG:'768',TO:'776',TT:'780',TN:'788',TR:'792',TM:'795',UG:'800',
  UA:'804',AE:'784',GB:'826',US:'840',UY:'858',UZ:'860',VE:'862',VN:'704',
  YE:'887',ZM:'894',ZW:'716',GD:'308',LC:'662',VC:'670',AG:'28',DM:'212',
  KN:'659',CW:'531',
}

interface WorldMapProps {
  destinations: Destination[]
  activeIndex: number
  onPinClick: (index: number) => void
  exiting?: boolean
  mapStyle?: 'default' | 'satellite' | 'minimal'
}

export function WorldMap({ destinations, activeIndex, onPinClick, exiting, mapStyle = 'default' }: WorldMapProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)
  const [zoom, setZoom] = useState(1)
  const containerRef = useRef<HTMLDivElement>(null)
  const { resolvedTheme } = useTheme()
  const isDark = resolvedTheme === 'dark'

  // Scroll-to-zoom, no drag
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const handler = (e: WheelEvent) => {
      e.preventDefault()
      setZoom(prev => Math.min(3.5, Math.max(1, prev - e.deltaY * 0.0008)))
    }
    el.addEventListener('wheel', handler, { passive: false })
    return () => el.removeEventListener('wheel', handler)
  }, [])

  const highlightIndex  = hoveredIndex ?? activeIndex
  const highlightedId   = ISO_NUMERIC[destinations[highlightIndex]?.countryCode ?? ''] ?? ''
  const highlightAccent = destinations[highlightIndex]?.culturalTheme.accent ?? 'var(--color-accent)'

  const isMinimal   = mapStyle === 'minimal'
  const isSatellite = mapStyle === 'satellite'

  return (
    <motion.div
      ref={containerRef}
      className="relative w-full h-full overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: exiting ? 0 : 1 }}
      transition={{ duration: 0.6, ease: 'easeInOut' }}
      style={{ cursor: zoom > 1 ? 'zoom-out' : 'default' }}
      onMouseLeave={() => setHoveredIndex(null)}
    >
      <div
        style={{
          width: '100%',
          height: '100%',
          transform: `scale(${zoom})`,
          transformOrigin: 'center center',
          transition: 'transform 0.12s ease-out',
        }}
      >
        <ComposableMap
          projectionConfig={{ scale: 155, center: [0, 10] }}
          style={{ width: '100%', height: '100%' }}
        >
          {/* Ocean — color shifts per style */}
          <Sphere
            id="ocean-sphere"
            fill={
              isSatellite ? (isDark ? '#0d1b2a' : '#b8d4e8')
              : isMinimal  ? 'color-mix(in srgb, var(--color-text) 3%, transparent)'
              :               'color-mix(in srgb, var(--color-text) 6%, transparent)'
            }
            stroke={
              isSatellite ? (isDark ? '#1a3a5c' : '#8ab4ce')
              : 'color-mix(in srgb, var(--color-text) 12%, transparent)'
            }
            strokeWidth={0.5}
          />

          {/* Grid lines — visible in default and satellite, hidden in minimal */}
          {!isMinimal && (
            <Graticule
              stroke={isSatellite ? (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.08)') : 'color-mix(in srgb, var(--color-text) 5%, transparent)'}
              strokeWidth={0.3}
            />
          )}

          <Geographies geography={GEO_URL}>
            {({ geographies }: { geographies: Array<{ rsmKey: string; id?: string }> }) =>
              geographies.map((geo) => {
                const isHighlighted = highlightedId !== '' && String(geo.id) === highlightedId

                const fill = isHighlighted
                  ? highlightAccent
                  : isSatellite
                  ? (isDark ? '#1e3a52' : '#7aaabf')
                  : isMinimal
                  ? 'color-mix(in srgb, var(--color-text) 6%, transparent)'
                  : 'color-mix(in srgb, var(--color-text) 16%, transparent)'

                const stroke = isHighlighted
                  ? 'rgba(0,0,0,0.2)'
                  : isSatellite
                  ? (isDark ? '#2a5278' : '#5a8fa8')
                  : isMinimal
                  ? 'color-mix(in srgb, var(--color-text) 12%, transparent)'
                  : 'color-mix(in srgb, var(--color-bg) 60%, transparent)'

                return (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    style={{
                      default: {
                        fill,
                        stroke,
                        strokeWidth: isMinimal ? 0.8 : 0.5,
                        outline: 'none',
                        transition: 'fill 0.3s ease',
                      },
                      hover: {
                        fill,
                        stroke,
                        strokeWidth: isMinimal ? 0.8 : 0.5,
                        outline: 'none',
                      },
                      pressed: { outline: 'none' },
                    }}
                  />
                )
              })
            }
          </Geographies>

          {destinations.map((dest, i) => {
            const isActive  = activeIndex === i
            const isHovered = hoveredIndex === i
            const accent    = dest.culturalTheme.accent

            return (
              <Marker
                key={dest.city}
                coordinates={[dest.coordinates.lng, dest.coordinates.lat]}
                onClick={() => onPinClick(i)}
                style={{ cursor: 'pointer' }}
              >
                {/* Pulse ring */}
                <motion.circle
                  r={0}
                  fill="none"
                  stroke="white"
                  strokeWidth={1.2}
                  animate={isActive || isHovered ? { r: [4, 13], opacity: [0.5, 0] } : { r: 0, opacity: 0 }}
                  transition={{ duration: 1.8, repeat: Infinity, ease: 'easeOut' }}
                />

                {/* Core dot */}
                <motion.circle
                  r={isActive ? 3.5 : 2.5}
                  fill="white"
                  animate={{ r: isActive ? 3.5 : 2.5 }}
                  transition={{ duration: 0.3 }}
                  style={{ cursor: 'pointer' }}
                  onMouseEnter={() => setHoveredIndex(i)}
                  onMouseLeave={() => setHoveredIndex(null)}
                />
              </Marker>
            )
          })}
        </ComposableMap>
      </div>

      {/* Zoom hint */}
      {zoom === 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 pointer-events-none">
          <p className="text-xs tracking-widest uppercase opacity-30"
            style={{ color: 'var(--color-text)' }}>
            scroll to zoom
          </p>
        </div>
      )}
    </motion.div>
  )
}

'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { ComposableMap, Geographies, Geography, Marker, ZoomableGroup } from 'react-simple-maps'
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
}

const RING_COUNT = 22

export function WorldMap({ destinations, activeIndex, onPinClick, exiting }: WorldMapProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)

  const highlightIndex = hoveredIndex ?? activeIndex
  const highlightedId = ISO_NUMERIC[destinations[highlightIndex]?.countryCode ?? ''] ?? ''

  return (
    <motion.div
      className="relative w-full h-full"
      initial={{ opacity: 0 }}
      animate={{ opacity: exiting ? 0 : 1 }}
      transition={{ duration: 0.6, ease: 'easeInOut' }}
    >
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <svg width="100%" height="100%">
          {Array.from({ length: RING_COUNT }).map((_, i) => (
            <circle
              key={i}
              cx="54%" cy="44%"
              r={`${(i + 1) * 4.2}%`}
              fill="none"
              stroke="var(--color-text)"
              strokeWidth="0.4"
              opacity={0.07 - i * 0.002}
            />
          ))}
        </svg>
      </div>

      <ComposableMap
        projectionConfig={{ scale: 155, center: [0, 10] }}
        style={{ width: '100%', height: '100%' }}
      >
        <defs>
          <pattern id="halftone" x="0" y="0" width="6" height="6" patternUnits="userSpaceOnUse">
            <circle cx="3" cy="3" r="1.5" fill="var(--color-text)" opacity="0.65" />
          </pattern>
          <pattern id="halftone-country" x="0" y="0" width="6" height="6" patternUnits="userSpaceOnUse">
            <circle cx="3" cy="3" r="1.9" fill="var(--color-accent)" opacity="0.9" />
          </pattern>
        </defs>

        <ZoomableGroup zoom={1} minZoom={0.6} maxZoom={5}>
          <Geographies geography={GEO_URL}>
            {({ geographies }: { geographies: Array<{ rsmKey: string; id?: string }> }) =>
              geographies.map((geo) => {
                const fill = highlightedId && geo.id === highlightedId
                  ? 'url(#halftone-country)'
                  : 'url(#halftone)'
                return (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    style={{
                      default: { fill, stroke: 'none', outline: 'none' },
                      hover:   { fill, stroke: 'none', outline: 'none' },
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
                  stroke={accent}
                  strokeWidth={1.5}
                  animate={isActive ? { r: [6, 18], opacity: [0.7, 0] } : { r: 0, opacity: 0 }}
                  transition={{ duration: 1.6, repeat: Infinity, ease: 'easeOut' }}
                />

                {/* Dot */}
                <motion.circle
                  r={isActive ? 5 : 3.5}
                  fill={accent}
                  animate={{ r: isActive ? 5 : 3.5 }}
                  transition={{ duration: 0.3 }}
                  style={{ filter: `drop-shadow(0 0 ${isActive ? 8 : 3}px ${accent})`, cursor: 'pointer' }}
                  onMouseEnter={() => setHoveredIndex(i)}
                  onMouseLeave={() => setHoveredIndex(null)}
                />

                {/* City label */}
                <motion.text
                  textAnchor="middle"
                  y={isActive ? -16 : -13}
                  style={{
                    fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Segoe UI', Helvetica, Arial, sans-serif",
                    fontSize: isActive ? '13px' : '11px',
                    fill: accent,
                    fontWeight: isActive || isHovered ? 700 : 500,
                    cursor: 'pointer',
                    letterSpacing: '0.04em',
                  }}
                  animate={{ opacity: isActive || isHovered ? 1 : 0.65 }}
                  initial={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  onMouseEnter={() => setHoveredIndex(i)}
                  onMouseLeave={() => setHoveredIndex(null)}
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

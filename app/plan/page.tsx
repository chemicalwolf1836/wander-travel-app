'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useTheme } from 'next-themes'
import { ComposableMap, Geographies, Geography, Marker, Line } from 'react-simple-maps'
import { ArrowDown, ArrowUp, Copy, Minus, Plus, Route as RouteIcon, X, CalendarRange } from 'lucide-react'
import { toast } from 'sonner'
import { Navbar } from '@/components/Navbar'
import { getFavourites } from '@/lib/favourites'
import { DATA_SYNCED_EVENT } from '@/lib/syncEvents'
import {
  getRoute, saveRoute, addStop, removeStop, moveStop, setDays, totalDays, distanceKm,
  MIN_DAYS, MAX_DAYS, type Route,
} from '@/lib/route'
import type { Destination } from '@/types'

const GEO_URL = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json'

export default function PlanPage() {
  const [saved, setSaved] = useState<Destination[]>([])
  const [route, setRoute] = useState<Route>({ stops: [] })
  const [mounted, setMounted] = useState(false)
  const { resolvedTheme } = useTheme()
  const isDark = resolvedTheme !== 'light'

  useEffect(() => {
    const load = () => { setSaved(getFavourites()); setRoute(getRoute()) }
    load()
    setMounted(true)
    window.addEventListener(DATA_SYNCED_EVENT, load)
    return () => window.removeEventListener(DATA_SYNCED_EVENT, load)
  }, [])

  function update(next: Route) {
    setRoute(next)
    saveRoute(next)
  }

  const byCity = useMemo(() => new Map(saved.map(d => [d.city, d])), [saved])
  // Stops whose place was unsaved since are skipped, not shown broken.
  const stops = route.stops.filter(s => byCity.has(s.city))
  const notInRoute = saved.filter(d => !route.stops.some(s => s.city === d.city))
  const legs = stops.slice(1).map((s, i) => distanceKm(byCity.get(stops[i].city)!.coordinates, byCity.get(s.city)!.coordinates))
  const totalKm = Math.round(legs.reduce((a, b) => a + b, 0))
  const days = totalDays({ stops })

  function copyRoute() {
    const lines = [`My Wander route: ${days} days, ${stops.length} stops`, '']
    let day = 1
    stops.forEach((s, i) => {
      const d = byCity.get(s.city)!
      lines.push(`Days ${day}–${day + s.days - 1}: ${d.city}, ${d.country}`)
      if (legs[i]) lines.push(`   then ~${Math.round(legs[i]).toLocaleString()} km to ${stops[i + 1].city}`)
      day += s.days
    })
    navigator.clipboard.writeText(lines.join('\n')).then(() => toast('Route copied'), () => toast.error("Couldn't copy"))
  }

  const muted = 'color-mix(in srgb, var(--color-text) 8%, transparent)'
  const border = '1px solid color-mix(in srgb, var(--color-text) 12%, transparent)'

  if (!mounted) return null

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: 'var(--color-bg)', color: 'var(--color-text)' }}>
      <Navbar />
      <main className="flex-1 w-full max-w-3xl mx-auto px-4 sm:px-6 pt-24 pb-16">
        <div className="flex items-center gap-3 mb-1">
          <RouteIcon size={20} style={{ color: 'var(--color-accent)' }} aria-hidden="true" />
          <h1 className="text-3xl" style={{ fontFamily: 'var(--font-playfair)' }}>Plan a route</h1>
        </div>
        <p className="text-sm mb-6" style={{ color: 'var(--color-subtle)' }}>
          Chain your saved places into one trip and set how long to stay in each.
        </p>

        {saved.length === 0 ? (
          <div className="rounded-3xl p-8 text-center" style={{ backgroundColor: 'var(--color-card-bg)', border }}>
            <p className="mb-4">Save a few places first, then come back to link them up.</p>
            <Link href="/discover" className="inline-flex items-center justify-center min-h-11 px-6 rounded-full text-sm font-semibold"
              style={{ backgroundColor: 'var(--color-accent)', color: 'var(--color-on-accent)' }}>Find destinations</Link>
          </div>
        ) : (
          <>
            {/* Map of the route */}
            <div className="rounded-3xl overflow-hidden mb-4" style={{ backgroundColor: 'var(--color-card-bg)', border }}>
              <ComposableMap projectionConfig={{ scale: 140, center: [0, 20] }} style={{ width: '100%', height: 'auto' }}>
                <Geographies geography={GEO_URL}>
                  {({ geographies }) => geographies.map(geo => (
                    <Geography key={geo.rsmKey} geography={geo} style={{
                      default: { fill: isDark ? '#1f2937' : '#e5e0d6', stroke: isDark ? '#0b1120' : '#f5f0e8', strokeWidth: 0.4, outline: 'none' },
                      hover: { fill: isDark ? '#1f2937' : '#e5e0d6', outline: 'none' },
                      pressed: { outline: 'none' },
                    }} />
                  ))}
                </Geographies>
                {stops.slice(1).map((s, i) => {
                  const a = byCity.get(stops[i].city)!.coordinates
                  const b = byCity.get(s.city)!.coordinates
                  return <Line key={`${stops[i].city}-${s.city}`} from={[a.lng, a.lat]} to={[b.lng, b.lat]}
                    stroke="var(--color-accent)" strokeWidth={1.5} strokeLinecap="round" strokeDasharray="4 3" />
                })}
                {stops.map((s, i) => {
                  const c = byCity.get(s.city)!.coordinates
                  return (
                    <Marker key={s.city} coordinates={[c.lng, c.lat]}>
                      <circle r={7} fill="var(--color-accent)" stroke={isDark ? '#0b1120' : '#fff'} strokeWidth={1.5} />
                      <text textAnchor="middle" y={3} style={{ fontSize: 8, fontWeight: 700, fill: isDark ? '#0b1120' : '#fff' }}>{i + 1}</text>
                    </Marker>
                  )
                })}
              </ComposableMap>
            </div>

            {/* Summary */}
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <p className="text-sm" role="status">
                <span className="font-semibold">{days} {days === 1 ? 'day' : 'days'}</span>
                <span style={{ color: 'var(--color-subtle)' }}> · {stops.length} {stops.length === 1 ? 'stop' : 'stops'}{totalKm > 0 && ` · about ${totalKm.toLocaleString()} km between them`}</span>
              </p>
              {stops.length > 0 && (
                <button onClick={copyRoute} className="inline-flex items-center gap-2 min-h-10 px-4 rounded-full text-sm" style={{ border }}>
                  <Copy size={14} aria-hidden="true" /> Copy route
                </button>
              )}
            </div>

            {/* Stops */}
            <ol className="flex flex-col gap-2 mb-8">
              {stops.map((s, i) => {
                const d = byCity.get(s.city)!
                return (
                  <li key={s.city}>
                    <div className="flex flex-wrap items-center gap-3 rounded-2xl px-4 py-3" style={{ backgroundColor: 'var(--color-card-bg)', border }}>
                      <span className="w-7 h-7 flex-shrink-0 rounded-full flex items-center justify-center text-xs font-bold"
                        style={{ backgroundColor: 'var(--color-accent)', color: 'var(--color-on-accent)' }}>{i + 1}</span>
                      <div className="flex-1 min-w-[8rem]">
                        <p className="font-medium">{d.city}</p>
                        <p className="text-xs" style={{ color: 'var(--color-subtle)' }}>{d.country}</p>
                      </div>
                      <div className="flex items-center gap-1" role="group" aria-label={`Days in ${d.city}`}>
                        <button onClick={() => update(setDays(route, s.city, s.days - 1))} disabled={s.days <= MIN_DAYS}
                          aria-label={`One day less in ${d.city}`} className="w-9 h-9 rounded-full flex items-center justify-center disabled:opacity-30" style={{ backgroundColor: muted }}>
                          <Minus size={14} />
                        </button>
                        <span className="w-16 text-center text-sm tabular-nums">{s.days} {s.days === 1 ? 'day' : 'days'}</span>
                        <button onClick={() => update(setDays(route, s.city, s.days + 1))} disabled={s.days >= MAX_DAYS}
                          aria-label={`One more day in ${d.city}`} className="w-9 h-9 rounded-full flex items-center justify-center disabled:opacity-30" style={{ backgroundColor: muted }}>
                          <Plus size={14} />
                        </button>
                      </div>
                      <div className="flex items-center gap-1">
                        <button onClick={() => update(moveStop(route, route.stops.indexOf(s), -1))} disabled={i === 0}
                          aria-label={`Move ${d.city} earlier`} className="w-9 h-9 rounded-full flex items-center justify-center disabled:opacity-30" style={{ backgroundColor: muted }}>
                          <ArrowUp size={14} />
                        </button>
                        <button onClick={() => update(moveStop(route, route.stops.indexOf(s), 1))} disabled={i === stops.length - 1}
                          aria-label={`Move ${d.city} later`} className="w-9 h-9 rounded-full flex items-center justify-center disabled:opacity-30" style={{ backgroundColor: muted }}>
                          <ArrowDown size={14} />
                        </button>
                        <Link href={`/trip/${encodeURIComponent(d.city)}`} aria-label={`Trip plan for ${d.city}`}
                          className="w-9 h-9 rounded-full flex items-center justify-center" style={{ backgroundColor: muted }}>
                          <CalendarRange size={14} />
                        </Link>
                        <button onClick={() => update(removeStop(route, s.city))}
                          aria-label={`Remove ${d.city} from the route`} className="w-9 h-9 rounded-full flex items-center justify-center" style={{ backgroundColor: muted }}>
                          <X size={14} />
                        </button>
                      </div>
                    </div>
                    {legs[i] !== undefined && (
                      <p className="text-xs pl-14 py-1" style={{ color: 'var(--color-subtle)' }}>
                        ~{Math.round(legs[i]).toLocaleString()} km to {stops[i + 1].city}
                      </p>
                    )}
                  </li>
                )
              })}
            </ol>

            {/* Add saved places */}
            {notInRoute.length > 0 && (
              <section>
                <h2 className="text-lg mb-3" style={{ fontFamily: 'var(--font-playfair)' }}>
                  {stops.length === 0 ? 'Pick your first stop' : 'Add another stop'}
                </h2>
                <div className="flex flex-wrap gap-2">
                  {notInRoute.map(d => (
                    <button key={d.city} onClick={() => update(addStop(route, d.city))}
                      className="inline-flex items-center gap-1.5 min-h-10 px-4 rounded-full text-sm"
                      style={{ backgroundColor: muted, border }}>
                      <Plus size={14} aria-hidden="true" /> {d.city}
                    </button>
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </main>
    </div>
  )
}

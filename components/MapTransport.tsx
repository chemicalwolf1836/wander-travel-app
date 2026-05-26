'use client'

import dynamic from 'next/dynamic'
import { Component, type ErrorInfo, type ReactNode } from 'react'

const MapInner = dynamic(() => import('./MapInner'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center"
      style={{ backgroundColor: 'var(--color-bg)' }}>
      <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin"
        style={{ borderColor: 'var(--color-accent)' }} />
    </div>
  ),
})

interface MapTransportProps {
  lat: number
  lng: number
  cityName: string
  darkMode: boolean
  onFlyComplete: () => void
}

interface ErrorBoundaryState {
  hasError: boolean
}

class MapErrorBoundary extends Component<{ children: ReactNode }, ErrorBoundaryState> {
  state = { hasError: false }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[MapTransport] Error:', error, info)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          className="w-full h-full flex items-center justify-center text-sm"
          style={{ color: 'var(--color-subtle)' }}
        >
          Map unavailable - check your Mapbox token
        </div>
      )
    }
    return this.props.children
  }
}

export function MapTransport(props: MapTransportProps) {
  return (
    <MapErrorBoundary>
      <MapInner {...props} />
    </MapErrorBoundary>
  )
}

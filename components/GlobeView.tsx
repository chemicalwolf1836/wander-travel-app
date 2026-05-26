'use client'

import dynamic from 'next/dynamic'
import { Component, type ErrorInfo, type ReactNode } from 'react'
import type { Destination } from '@/types'

// Lazy-load the actual globe - WebGL only works in the browser
const GlobeInner = dynamic(() => import('./GlobeInner'), {
  ssr: false,
  loading: () => (
    <div
      className="w-full h-full flex items-center justify-center"
      style={{ color: 'var(--color-subtle)' }}
    >
      <div className="w-32 h-32 rounded-full border-2 border-dashed animate-spin opacity-30"
        style={{ borderColor: 'var(--color-accent)' }} />
    </div>
  ),
})

interface GlobeViewProps {
  destinations: Destination[]
  activeIndex: number
  onPinClick: (index: number) => void
  exiting?: boolean
}

interface ErrorBoundaryState {
  hasError: boolean
}

class GlobeErrorBoundary extends Component<{ children: ReactNode }, ErrorBoundaryState> {
  state = { hasError: false }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[GlobeView] Error:', error, info)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          className="w-full h-full flex items-center justify-center text-sm"
          style={{ color: 'var(--color-subtle)' }}
        >
          Globe unavailable on this device
        </div>
      )
    }
    return this.props.children
  }
}

export function GlobeView(props: GlobeViewProps) {
  return (
    <GlobeErrorBoundary>
      <GlobeInner {...props} />
    </GlobeErrorBoundary>
  )
}

'use client'

import { useEffect } from 'react'
import { RefreshCw } from 'lucide-react'

// Root error boundary. In Next 16 the retry callback is `unstable_retry` (not `reset`).
export default function Error({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string }
  unstable_retry: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4"
      style={{ backgroundColor: 'var(--color-bg)', color: 'var(--color-text)' }}>
      <p className="text-4xl">😕</p>
      <p className="text-lg">Something went wrong.</p>
      <button onClick={() => unstable_retry()}
        className="flex items-center gap-2 px-6 py-3 rounded-full text-sm"
        style={{ backgroundColor: 'var(--color-accent)', color: 'var(--color-bg)' }}>
        <RefreshCw size={14} /> Try again
      </button>
    </div>
  )
}

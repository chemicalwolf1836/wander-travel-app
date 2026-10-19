import Link from 'next/link'

// Root 404 — shown for unknown URLs and when a route calls notFound().
export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-5 px-6 text-center"
      style={{ backgroundColor: 'var(--color-bg)', color: 'var(--color-text)' }}>
      <p className="text-xs tracking-widest uppercase" style={{ color: 'var(--color-subtle)' }}>
        404 · Off the map
      </p>
      <h1 className="text-4xl md:text-5xl" style={{ fontFamily: 'var(--font-playfair)' }}>
        This page wandered off.
      </h1>
      <p className="max-w-sm text-sm leading-relaxed opacity-80">
        The link may be old, or the destination was never saved on this device.
      </p>
      <div className="flex flex-col sm:flex-row gap-3 mt-2">
        <Link href="/discover"
          className="inline-flex items-center justify-center min-h-11 px-6 rounded-full text-sm font-semibold"
          style={{ backgroundColor: 'var(--color-accent)', color: 'var(--color-bg)' }}>
          Find a destination
        </Link>
        <Link href="/"
          className="inline-flex items-center justify-center min-h-11 px-6 rounded-full text-sm"
          style={{ border: '1px solid color-mix(in srgb, var(--color-text) 18%, transparent)' }}>
          Back to home
        </Link>
      </div>
    </div>
  )
}

// Root loading UI — shown during navigation and Suspense waits.
export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center"
      style={{ backgroundColor: 'var(--color-bg)' }}>
      <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin"
        style={{ borderColor: 'var(--color-accent)' }} />
    </div>
  )
}

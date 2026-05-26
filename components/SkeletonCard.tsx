export function SkeletonCard() {
  return (
    <div
      className="rounded-2xl p-6 space-y-4 overflow-hidden"
      style={{
        backgroundColor: 'var(--color-card-bg)',
        border: '1px solid color-mix(in srgb, var(--color-primary) 20%, transparent)',
      }}
    >
      {/* City name */}
      <div className="h-8 w-2/3 rounded-lg animate-pulse" style={{ backgroundColor: 'color-mix(in srgb, var(--color-primary) 20%, transparent)' }} />
      {/* Country badge */}
      <div className="h-5 w-1/3 rounded-full animate-pulse" style={{ backgroundColor: 'color-mix(in srgb, var(--color-primary) 15%, transparent)' }} />
      {/* Weather */}
      <div className="h-7 w-1/2 rounded-full animate-pulse" style={{ backgroundColor: 'color-mix(in srgb, var(--color-primary) 10%, transparent)' }} />
      {/* Description lines */}
      <div className="space-y-2 pt-2">
        <div className="h-4 w-full rounded animate-pulse" style={{ backgroundColor: 'color-mix(in srgb, var(--color-primary) 10%, transparent)' }} />
        <div className="h-4 w-5/6 rounded animate-pulse" style={{ backgroundColor: 'color-mix(in srgb, var(--color-primary) 10%, transparent)' }} />
        <div className="h-4 w-4/6 rounded animate-pulse" style={{ backgroundColor: 'color-mix(in srgb, var(--color-primary) 10%, transparent)' }} />
      </div>
      {/* Tags */}
      <div className="flex gap-2 pt-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-6 w-16 rounded-full animate-pulse" style={{ backgroundColor: 'color-mix(in srgb, var(--color-primary) 15%, transparent)' }} />
        ))}
      </div>
    </div>
  )
}

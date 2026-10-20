'use client'

/* ── Clickable item chip (See / Eat) ── */
export function ItemChip({ label, onClick, onPrefetch }: { label: string; onClick: () => void; onPrefetch?: () => void }) {
  return (
    <button onClick={onClick} onMouseEnter={onPrefetch} onFocus={onPrefetch}
      className="mono-chip min-h-9 text-sm px-4 rounded-xl">
      {label}
    </button>
  )
}

/* ── Experience vibe chip (Best for) — same shape, outlined instead of filled ── */
export function ExperienceChip({ label, onClick, onPrefetch }: { label: string; onClick: () => void; onPrefetch?: () => void }) {
  return (
    <button onClick={onClick} onMouseEnter={onPrefetch} onFocus={onPrefetch}
      className="mono-chip is-outline min-h-9 text-sm px-4 rounded-xl">
      {label}
    </button>
  )
}

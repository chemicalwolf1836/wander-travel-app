'use client'

/* ── Clickable item chip (See / Eat) ── */
export function ItemChip({ label, emoji, onClick, onPrefetch }: { label: string; emoji?: string; onClick: () => void; onPrefetch?: () => void }) {
  return (
    <button onClick={onClick} onMouseEnter={onPrefetch} onFocus={onPrefetch}
      className="mono-chip inline-flex items-center gap-1.5 min-h-9 text-sm px-3.5 rounded-xl">
      {emoji && <span className="emoji" aria-hidden="true">{emoji}</span>}
      {label}
    </button>
  )
}

/* ── Experience vibe chip (Best for) — same shape, outlined instead of filled ── */
export function ExperienceChip({ label, emoji, onClick, onPrefetch }: { label: string; emoji?: string; onClick: () => void; onPrefetch?: () => void }) {
  return (
    <button onClick={onClick} onMouseEnter={onPrefetch} onFocus={onPrefetch}
      className="mono-chip is-outline inline-flex items-center gap-1.5 min-h-9 text-sm px-3.5 rounded-xl">
      {emoji && <span className="emoji" aria-hidden="true">{emoji}</span>}
      {label}
    </button>
  )
}

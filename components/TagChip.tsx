interface TagChipProps {
  label: string
}

export function TagChip({ label }: TagChipProps) {
  return (
    <span
      className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium"
      style={{
        backgroundColor: 'color-mix(in srgb, var(--color-accent) 15%, transparent)',
        color: 'var(--color-accent)',
        border: '1px solid color-mix(in srgb, var(--color-accent) 30%, transparent)',
      }}
    >
      {label}
    </span>
  )
}

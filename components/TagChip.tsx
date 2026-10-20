interface TagChipProps {
  label: string
}

export function TagChip({ label }: TagChipProps) {
  return (
    <span
      className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium"
      style={{
        backgroundColor: 'color-mix(in srgb, var(--color-text) 6%, transparent)',
        color: 'var(--color-text)',
      }}
    >
      {label}
    </span>
  )
}

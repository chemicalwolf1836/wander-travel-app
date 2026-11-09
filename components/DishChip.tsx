import { Utensils } from 'lucide-react'

interface DishChipProps {
  name: string
}

export function DishChip({ name }: DishChipProps) {
  return (
    <span
      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs"
      style={{
        backgroundColor: 'color-mix(in srgb, var(--color-text) 6%, transparent)',
        color: 'var(--color-text)',
      }}
    >
      <Utensils size={10} />
      {name}
    </span>
  )
}

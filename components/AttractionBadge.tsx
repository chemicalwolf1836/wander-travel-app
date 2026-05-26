import { Landmark, TreePine, Palette, Camera } from 'lucide-react'

interface AttractionBadgeProps {
  name: string
  type?: string
}

const TYPE_ICONS: Record<string, React.ReactNode> = {
  museum: <Palette size={12} />,
  nature: <TreePine size={12} />,
  landmark: <Landmark size={12} />,
  historic: <Landmark size={12} />,
}

export function AttractionBadge({ name, type }: AttractionBadgeProps) {
  const icon = (type && TYPE_ICONS[type.toLowerCase()]) ?? <Camera size={12} />

  return (
    <div
      className="flex items-center gap-2 text-sm py-1"
      style={{ color: 'var(--color-text)' }}
    >
      <span style={{ color: 'var(--color-accent)', flexShrink: 0 }}>{icon}</span>
      <span className="opacity-90">{name}</span>
    </div>
  )
}

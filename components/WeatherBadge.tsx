'use client'

import { Cloud, Sun, CloudRain, CloudSnow, CloudLightning, Wind } from 'lucide-react'
import type { WeatherData } from '@/types'

const WEATHER_ICONS: Record<string, React.ReactNode> = {
  Clear: <Sun size={14} />,
  Clouds: <Cloud size={14} />,
  Rain: <CloudRain size={14} />,
  Drizzle: <CloudRain size={14} />,
  Snow: <CloudSnow size={14} />,
  Thunderstorm: <CloudLightning size={14} />,
  Mist: <Wind size={14} />,
  Fog: <Wind size={14} />,
}

interface WeatherBadgeProps {
  weather: WeatherData
}

export function WeatherBadge({ weather }: WeatherBadgeProps) {
  const icon = WEATHER_ICONS[weather.condition] ?? <Cloud size={14} />

  return (
    <div
      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs"
      style={{
        backgroundColor: 'color-mix(in srgb, var(--color-accent) 15%, transparent)',
        color: 'var(--color-text)',
        border: '1px solid color-mix(in srgb, var(--color-accent) 30%, transparent)',
      }}
    >
      {icon}
      <span className="font-medium">{weather.temp}°C</span>
      <span style={{ color: 'var(--color-subtle)' }}>{weather.description}</span>
    </div>
  )
}

// CSS filter strings applied over a destination's hero image to nudge its mood
// toward the current weather. Consumed by lib/applyTheme.ts.
//
// (This file previously also held a set of per-region "cultural" theme presets
// and a region→preset map. Those were superseded: the actual cultural theme now
// comes inline from the /api/suggest Claude response, so the presets were unused
// and have been removed.)
export const weatherModifiers: Record<string, string> = {
  Clear: 'brightness(1.1) saturate(1.15)',
  Clouds: 'brightness(0.95) saturate(0.9)',
  Rain: 'brightness(0.85) saturate(0.8) hue-rotate(10deg)',
  Drizzle: 'brightness(0.85) saturate(0.8) hue-rotate(10deg)',
  Snow: 'brightness(1.05) saturate(0.7)',
  Thunderstorm: 'brightness(0.75) saturate(1.2) contrast(1.1)',
  Mist: 'brightness(0.9) saturate(0.75)',
}

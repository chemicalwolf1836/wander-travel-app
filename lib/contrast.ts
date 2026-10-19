// WCAG contrast helpers. Destination colours come from the AI, so an accent can
// be anything from pale yellow to deep maroon; these keep text drawn in that
// accent readable on whatever surface it sits on, while keeping its hue.

type RGB = [number, number, number]

/** Parse #rgb / #rrggbb (with optional alpha, ignored). Returns null for anything else. */
export function parseHex(color: string): RGB | null {
  const m = color.trim().match(/^#([0-9a-f]{3,8})$/i)
  if (!m) return null
  let h = m[1]
  if (h.length === 3 || h.length === 4) h = h.slice(0, 3).split('').map((c) => c + c).join('')
  if (h.length !== 6 && h.length !== 8) return null
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16)) as RGB
}

function toHex([r, g, b]: RGB): string {
  return '#' + [r, g, b].map((v) => Math.round(Math.min(255, Math.max(0, v))).toString(16).padStart(2, '0')).join('')
}

function luminance([r, g, b]: RGB): number {
  const lin = (v: number) => {
    const c = v / 255
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  }
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b)
}

/** WCAG contrast ratio between two hex colours (1–21), or 1 if either can't be parsed. */
export function contrastRatio(a: string, b: string): number {
  const x = parseHex(a)
  const y = parseHex(b)
  if (!x || !y) return 1
  const la = luminance(x)
  const lb = luminance(y)
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05)
}

/**
 * Return `fg`, or the nearest tint/shade of it, that reaches `min` contrast on
 * `bg`. Mixes toward white on dark surfaces and toward black on light ones, so
 * the hue survives. Unparseable input falls back to white/black text.
 */
export function readableOn(fg: string, bg: string, min = 4.5): string {
  const f = parseHex(fg)
  const b = parseHex(bg)
  if (!b) return fg
  const darkBg = luminance(b) < 0.18
  const target: RGB = darkBg ? [255, 255, 255] : [0, 0, 0]
  if (!f) return toHex(target)
  if (contrastRatio(toHex(f), bg) >= min) return toHex(f)
  for (let t = 0.05; t <= 1.0001; t += 0.05) {
    const mixed = toHex(f.map((v, i) => v + (target[i] - v) * t) as RGB)
    if (contrastRatio(mixed, bg) >= min) return mixed
  }
  return toHex(target)
}

/** `a` blended over `b` (weight 0–1 of `a`); returns `a` unchanged if either can't be parsed. */
export function mixHex(a: string, b: string, weight: number): string {
  const x = parseHex(a)
  const y = parseHex(b)
  if (!x || !y) return a
  return toHex(x.map((v, i) => v * weight + y[i] * (1 - weight)) as RGB)
}

/** Dark or white text, whichever reads better on a solid `bg` (e.g. an accent-filled button). */
export function textOn(bg: string): string {
  return contrastRatio('#0a0f1e', bg) >= contrastRatio('#ffffff', bg) ? '#0a0f1e' : '#ffffff'
}

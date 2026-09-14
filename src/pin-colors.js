// Pin colours are a property of the tour, not of individual interactions:
// one colour for hotspots and one for info points, so a tour reads as a set
// rather than as a bag of differently coloured markers.
//
// The presets are a starting point, not a limit; any hex code is allowed.
// That is why the icon's colour is calculated rather than chosen, since with
// an open colour field nobody can hand-pick a readable ink for every value.

export const presetColors = [
  { label: 'Lime', value: '#eeff66' },
  { label: 'Aqua', value: '#62c2cc' },
  { label: 'Orange', value: '#f17022' },
  { label: 'Rose', value: '#ff5c8a' },
  { label: 'Violet', value: '#a78bfa' },
  { label: 'Blue', value: '#60a5fa' },
  { label: 'White', value: '#ffffff' },
  { label: 'Ink', value: '#171b1c' },
]

// The originals, so a tour made before this existed is unchanged.
export const defaultTheme = { hotspot: '#eeff66', info: '#62c2cc' }

const INK_DARK = '#171b1c'
const INK_LIGHT = '#ffffff'

// Accepts #abc, #aabbcc, or the same without the hash. Returns a normalised
// #aabbcc, or null when it is not a colour, which is what the hex field uses
// to decide whether to apply what has been typed so far.
export function normalizeHex(value) {
  const trimmed = String(value || '').trim().replace(/^#/, '')
  const expanded = trimmed.length === 3 ? trimmed.replace(/./g, (char) => char + char) : trimmed
  return /^[0-9a-fA-F]{6}$/.test(expanded) ? `#${expanded.toLowerCase()}` : null
}

function relativeLuminance(hex) {
  const value = normalizeHex(hex) || defaultTheme.hotspot
  const channel = (offset) => {
    const part = parseInt(value.slice(offset, offset + 2), 16) / 255
    return part <= 0.03928 ? part / 12.92 : ((part + 0.055) / 1.055) ** 2.4
  }
  return 0.2126 * channel(1) + 0.7152 * channel(3) + 0.0722 * channel(5)
}

// Whichever of the two inks contrasts better, rather than a brightness
// threshold. A threshold gets orange wrong: it is bright enough to look light
// but white text on it only reaches about 3:1, where near-black reaches 6:1.
export function inkFor(hex) {
  const luminance = relativeLuminance(hex)
  const against = (other) => {
    const lighter = Math.max(luminance, other)
    const darker = Math.min(luminance, other)
    return (lighter + 0.05) / (darker + 0.05)
  }
  return against(relativeLuminance(INK_DARK)) >= against(relativeLuminance(INK_LIGHT)) ? INK_DARK : INK_LIGHT
}

export function pinStyle(hex) {
  const background = normalizeHex(hex) || defaultTheme.hotspot
  return `background:${background};color:${inkFor(background)}`
}

export function themeFrom(value) {
  return {
    hotspot: normalizeHex(value?.hotspot) || defaultTheme.hotspot,
    info: normalizeHex(value?.info) || defaultTheme.info,
  }
}

/**
 * Computed style verifications.
 */

/** Assert color matches expected (handles rgb/rgba/hex normalization) */
export function assertColor(computed: string, expected: string): boolean {
  const n = (s: string) => s.replace(/\s/g, '').toLowerCase()
  return n(computed) === n(expected) || rgbEquals(computed, expected)
}

function rgbEquals(a: string, b: string): boolean {
  const toRgb = (s: string): string | null => {
    const rgb = s.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/)
    if (rgb) return `${rgb[1]},${rgb[2]},${rgb[3]}`
    const hex = s.match(/^#?([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i)
    if (hex) return `${parseInt(hex[1], 16)},${parseInt(hex[2], 16)},${parseInt(hex[3], 16)}`
    return null
  }
  const ar = toRgb(a)
  const br = toRgb(b)
  return ar !== null && br !== null && ar === br
}

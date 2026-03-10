/**
 * Returns a CSS calc value for the given rhythm units.
 * Use in token configs and wherever you need rhythm values programmatically.
 *
 * @param n - Number of rhythm units (e.g. 0.5, 2, 3)
 * @returns CSS value string, e.g. `calc(0.5 * var(--spacing-r))`
 *
 * @example
 * getRhythm(0.5)   // calc(0.5 * var(--spacing-r))
 * getRhythm(2)     // calc(2 * var(--spacing-r))
 * getRhythm(1, 3)  // calc(var(--spacing-r) / 3) – for 1/3r
 */
export function getRhythm(n: number): string
export function getRhythm(num: number, denom: number): string
export function getRhythm(num: number, denom?: number): string {
  if (denom !== undefined) {
    return num === 1
      ? `calc(var(--spacing-r) / ${denom})`
      : `calc(${num} * var(--spacing-r) / ${denom})`
  }
  if (num === 1) return 'var(--spacing-r)'
  return `calc(${num} * var(--spacing-r))`
}

/** Resolves "2r" strings to rhythm calc values, passthrough otherwise */
export function resolveRhythm(value: unknown): string | number {
  if (typeof value === 'string' && value.endsWith('r')) {
    const n = Number(value.slice(0, -1))
    if (!Number.isNaN(n)) {
      return getRhythm(n)
    }
  }
  return value as string | number
}

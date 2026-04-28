/**
 * Returns a CSS calc value for the given rhythm units.
 * Use in token configs and wherever you need rhythm values programmatically.
 *
 * @param n - Number of rhythm units (e.g. 0.5, 2, 3)
 * @returns CSS value string, e.g. `calc(0.5 * var(--spacing-root))`
 *
 * @example
 * getRhythm(0.5)   // calc(0.5 * var(--spacing-root))
 * getRhythm(2)     // calc(2 * var(--spacing-root))
 * getRhythm(1, 3)  // calc(var(--spacing-root) / 3) - for 1/3r
 */
export function getRhythm(n: number): string
export function getRhythm(num: number, denom: number): string
export function getRhythm(num: number, denom?: number): string {
  if (denom !== undefined) {
    return num === 1
      ? `calc(var(--spacing-root) / ${denom})`
      : `calc(${num} * var(--spacing-root) / ${denom})`
  }
  if (num === 1) return 'var(--spacing-root)'
  return `calc(${num} * var(--spacing-root))`
}

function parseRhythmFraction(value: string): [number, number] | undefined {
  const slashIndex = value.indexOf('/')
  if (slashIndex <= 0 || slashIndex !== value.lastIndexOf('/')) {
    return undefined
  }

  const numerator = Number(value.slice(0, slashIndex))
  const denominator = Number(value.slice(slashIndex + 1))
  if (
    !Number.isFinite(numerator) ||
    !Number.isFinite(denominator) ||
    denominator === 0
  ) {
    return undefined
  }

  return [numerator, denominator]
}

function resolveSingleRhythmValue(value: string): string | undefined {
  if (!value.endsWith('r')) {
    return undefined
  }

  const rhythmValue = value.slice(0, -1)
  const fraction = parseRhythmFraction(rhythmValue)
  if (fraction) {
    return getRhythm(fraction[0], fraction[1])
  }

  const n = Number(rhythmValue)
  if (!Number.isNaN(n)) {
    return getRhythm(n)
  }

  return undefined
}

function resolveRhythmShorthand(value: string): string | undefined {
  if (!/\s/.test(value) || /[(),]/.test(value)) {
    return undefined
  }

  const parts = value.trim().split(/\s+/)
  if (parts.length < 2) {
    return undefined
  }

  let didResolve = false
  const resolvedParts = parts.map((part) => {
    const resolved = resolveSingleRhythmValue(part)
    if (resolved !== undefined) {
      didResolve = true
      return resolved
    }

    return part
  })

  return didResolve ? resolvedParts.join(' ') : undefined
}

/** Resolves rhythm strings like "2r" or "1/5r" to calc values, passthrough otherwise */
export function resolveRhythm(value: unknown): string | number {
  if (typeof value === 'string') {
    const resolved = resolveSingleRhythmValue(value) ?? resolveRhythmShorthand(value)
    if (resolved !== undefined) {
      return resolved
    }
  }

  return value as string | number
}

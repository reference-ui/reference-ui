/**
 * Continuity rhythm station. Arbitrary magnitudes (`140r`, `220r`), an
 * arbitrary fraction (`137.5r`), and a negative fraction (`-2.5r`) compute
 * to root calc formulas with zero diagnostics, on min/max props (the legacy
 * gap) via both css() longhands and the JSX maxW/minH aliases.
 */
import { expect } from 'vitest'
import { hasWant, type AtomicCaseSpec } from '../../helpers.js'

const spec: AtomicCaseSpec = {
  id: 'ATM-RHYTHM-06',
  verify(result) {
    expect(hasWant(result, 'maxWidth', '140r')).toBe(true)
    expect(hasWant(result, 'minWidth', '137.5r')).toBe(true)
    expect(hasWant(result, 'marginTop', '-2.5r')).toBe(true)
    expect(hasWant(result, 'maxW', '220r')).toBe(true)
    expect(hasWant(result, 'minH', '12.5r')).toBe(true)
    expect(result.stylesheet).toContain('max-width: calc(140 * var(--spacing-root));')
    expect(result.stylesheet).toContain('min-width: calc(137.5 * var(--spacing-root));')
    expect(result.stylesheet).toContain('margin-top: calc(-2.5 * var(--spacing-root));')
    expect(result.stylesheet).toContain('max-width: calc(220 * var(--spacing-root));')
    expect(result.stylesheet).toContain('min-height: calc(12.5 * var(--spacing-root));')
    expect(result.diagnostics ?? []).toEqual([])
  },
}

export default spec

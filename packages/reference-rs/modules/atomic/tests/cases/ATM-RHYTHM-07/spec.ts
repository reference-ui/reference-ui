/**
 * Doom fortify pin for CONTINUITY-01 r-computation (doom-r-rule: BREAK).
 * Non-finite rhythm stems refuse behind the shared finiteness gate and pass
 * through raw, so the sheet carries no `inf`/`NaN` calc; finite controls and
 * finite neighbors still mint. Close (a) refuse-to-passthrough: legacy parity
 * on every named spelling, documented GIGO on genuine-overflow singles.
 * Assertions read sheet text — the css-validity gauge skips `var(`
 * declarations and never caught this class of mint.
 */
import { expect } from 'vitest'
import { hasWant, type AtomicCaseSpec } from '../../harness/helpers.js'

const GIANT = '9'.repeat(309)

const REFUSED = [
  'infr',
  'nanr',
  'infinityr',
  'Infinityr',
  '-infr',
  '1e309r',
  `${GIANT}r`,
  '1/infr',
  'inf/3r',
]

const spec: AtomicCaseSpec = {
  id: 'ATM-RHYTHM-07',
  verify(result) {
    for (const value of [...REFUSED, '2r', '1/3r', '0.5r', '1e-3r', '1e308r']) {
      expect(hasWant(result, 'marginTop', value)).toBe(true)
    }
    // No Rust-Display non-finite calc ever mints.
    expect(result.stylesheet).not.toContain('calc(inf ')
    expect(result.stylesheet).not.toContain('/ inf)')
    expect(result.stylesheet).not.toContain('calc(NaN ')
    expect(result.stylesheet).not.toMatch(/calc\([^;{}]*\binf\b/)
    expect(result.stylesheet).not.toMatch(/calc\([^;{}]*\bNaN\b/)
    // Close (a): refused stems pass through raw.
    for (const value of REFUSED) {
      expect(result.stylesheet).toContain(`margin-top: ${value}`)
    }
    // Controls and finite-neighbor guards still mint.
    expect(result.stylesheet).toContain('margin-top: calc(2 * var(--spacing-root))')
    expect(result.stylesheet).toContain('margin-top: calc(var(--spacing-root) / 3)')
    expect(result.stylesheet).toContain('margin-top: calc(0.5 * var(--spacing-root))')
    expect(result.stylesheet).toContain('margin-top: calc(0.001 * var(--spacing-root))')
    expect(result.stylesheet).toMatch(/margin-top: calc\(1\d+ \* var\(--spacing-root\)\)/)
    // Identifier-shaped stems name no spacing token, so they warn
    // ATM-W-UNKNOWN-TOKEN. Number-shaped refusals (`-infr`, `1e309r`, `1/infr`,
    // `inf/3r`, the 309-digit overflow) stay silent.
    expect(result.diagnostics.map(d => d.message)).toEqual([
      '`infr` is not a spacing token',
      '`nanr` is not a spacing token',
      '`infinityr` is not a spacing token',
      '`Infinityr` is not a spacing token',
    ])
    expect(result.diagnostics.every(d => d.code === 'ATM-W-UNKNOWN-TOKEN')).toBe(true)
  },
}

export default spec

/**
 * Cross-file refuse station (SPEC-V2-54 SUPERIOR, SPEC-V2-58). An
 * unresolvable specifier, a missing export, and a bare imported function
 * value each warn once and mint nothing while static siblings extract —
 * fail-closed-plus-diagnostic where v2 drops silently.
 */
import { expect } from 'vitest'
import { hasWant, type AtomicCaseSpec } from '../../helpers.js'

const spec: AtomicCaseSpec = {
  id: 'ATM-SITE-75',
  verify(result) {
    expect(hasWant(result, 'color', 'ghost')).toBe(false)
    expect(hasWant(result, 'margin', 'nope')).toBe(false)
    expect(hasWant(result, 'padding', '4px')).toBe(true)
    expect(hasWant(result, 'padding', '8px')).toBe(true)
    expect(hasWant(result, 'padding', '12px')).toBe(true)

    const diagnostics = result.diagnostics ?? []
    expect(diagnostics).toHaveLength(3)
    for (const diagnostic of diagnostics) {
      expect(diagnostic.severity).toBe('warning')
      expect(diagnostic.message).toMatch(/Dynamic non-literal/)
    }
  },
}

export default spec

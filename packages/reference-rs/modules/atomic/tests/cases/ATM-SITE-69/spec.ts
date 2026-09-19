/**
 * Dynamic-slot station (SPEC-V2-26 GAP-26). An unresolvable identifier in
 * a responsive value array warns once and is omitted while the null hole
 * skips silently; static leaves keep their breakpoints (arity honest).
 */
import { expect } from 'vitest'
import { getWantsForProp, hasWant, type AtomicCaseSpec } from '../../helpers.js'

const spec: AtomicCaseSpec = {
  id: 'ATM-SITE-69',
  verify(result) {
    expect(hasWant(result, 'padding', '4px', ['base'])).toBe(true)
    expect(getWantsForProp(result, 'padding')).toHaveLength(1)
    // Leading dynamic slot: the static leaf still lands on sm, not base.
    expect(hasWant(result, 'color', 'black', ['sm'])).toBe(true)
    expect(getWantsForProp(result, 'color')).toHaveLength(1)

    const diagnostics = result.diagnostics ?? []
    expect(diagnostics).toHaveLength(2)
    expect(diagnostics[0]!.severity).toBe('warning')
    expect(diagnostics[0]!.message).toMatch(/Dynamic non-literal/)
  },
}

export default spec

/**
 * Exact-plan-absent station (ATM-DIAG-09, Operation Error Correct Slice 0).
 * RED: a static runtime query the final plan omits must produce one located
 * non-fatal warning naming that exact declaration. The current
 * UnknownCondition warning is unlocated and names only the condition.
 */
import { expect } from 'vitest'
import { hasWant, type AtomicCaseSpec } from '../../helpers.js'

const spec: AtomicCaseSpec = {
  id: 'ATM-DIAG-09',
  verify(result) {
    // The static query is predicted: the want exists with its condition.
    expect(hasWant(result, 'color', 'red.500', ['_hovr'])).toBe(true)
    // The sibling still extracts; the compile stays fail-closed.
    expect(hasWant(result, 'color', 'blue.500')).toBe(true)

    // The final plan omits the predicted key: no plan, no class, no CSS.
    const plans = result.runtime?.stylePlans ?? []
    const predicted = plans.filter(
      p => p.prop === 'color' && p.when.includes('_hovr')
    )
    expect(predicted).toHaveLength(0)
    expect(result.stylesheet).not.toContain('hovr')
    expect(result.stylesheet).toContain('c_blue')

    // Exactly one non-fatal warning owns this miss.
    const diagnostics = result.diagnostics ?? []
    expect(diagnostics).toHaveLength(1)
    const miss = diagnostics[0]!
    expect(miss.severity).toBe('warning')
    expect(miss.code).toBe('ATM-W-UNKNOWN-CONDITION')

    // RED hinge 1: the warning must carry the miss site. Today it is
    // file-less (resolve/mod.rs lower_conditions pushes no location).
    expect(miss.file ?? '').toContain('absent.ts')
    expect(miss.line).toBeGreaterThan(0)
    expect(miss.column).toBeGreaterThan(0)

    // RED hinge 2: the warning must name the exact absent declaration —
    // prop and value — not just the condition key.
    expect(miss.message).toContain('color')
    expect(miss.message).toContain('red.500')
  },
}

export default spec

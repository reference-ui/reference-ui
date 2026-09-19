/**
 * Incidental-coverage station (ATM-DIAG-10, Operation Error Correct, Slice 0).
 * RED: the diagnosed site contributes no plan, but another source (plus the
 * harvest pool) contributes the exact key, so runtime paints and userspace
 * must stay silent. Today the dynamic warning still fires on default and no
 * coverage proof exists, so the silence assertion fails.
 */
import { expect } from 'vitest'
import { hasWant, type AtomicCaseSpec } from '../../helpers.js'

const spec: AtomicCaseSpec = {
  id: 'ATM-DIAG-10',
  verify(result) {
    // The static sibling still extracts beside the refused site.
    expect(hasWant(result, 'mt', '2r')).toBe(true)

    // The exact key exists at runtime: another source contributes color:red
    // (the harvest pool agrees), so the lookup paints.
    const plans = result.runtime?.stylePlans ?? []
    expect(
      plans.some(p => p.prop === 'color' && p.value === 'red' && p.when.length === 0),
      'exact key color:red contributed despite the refused site'
    ).toBe(true)

    // RED: userspace is silent because runtime paints — the refused site is
    // covered incidentally, so no default warning may name it.
    const diagnostics = result.diagnostics ?? []
    expect(
      diagnostics,
      `incidental coverage keeps userspace silent, got: ${diagnostics.map(d => d.code).join(', ')}`
    ).toHaveLength(0)
  },
}

export default spec

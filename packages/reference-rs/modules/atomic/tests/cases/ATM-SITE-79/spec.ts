/**
 * Ambiguous star station (Forge §1). A named import that two `export *`
 * barrels declare with different origins refuses: no fold, and each use
 * diagnoses exactly as an unresolvable import does.
 */
import { expect } from 'vitest'
import { hasWant, type AtomicCaseSpec } from '../../helpers.js'

const spec: AtomicCaseSpec = {
  id: 'ATM-SITE-79',
  verify(result) {
    // Neither twin folds; the spread's static sibling survives.
    expect(hasWant(result, 'color', 'red')).toBe(false)
    expect(hasWant(result, 'color', 'blue')).toBe(false)
    expect(hasWant(result, 'padding', '4px')).toBe(true)
    expect(result.wants ?? []).toHaveLength(1)

    expect(result.diagnostics).toEqual([
      expect.objectContaining({
        severity: 'warning',
        code: 'ATM-W-DYNAMIC-IDENTIFIER',
        message: "Dynamic non-literal identifier 'tone' encountered for prop 'color'",
      }),
      expect.objectContaining({
        severity: 'warning',
        code: 'ATM-W-UNFOLDABLE-SPREAD',
        message:
          'Dynamic object spread encountered in style object; keeping sibling properties',
      }),
    ])
  },
}

export default spec

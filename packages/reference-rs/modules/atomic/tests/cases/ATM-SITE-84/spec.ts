/**
 * Origin-precision station (Forge §3). An import resolves to its origin
 * binding only: a same-named write in another file never blocks an import
 * that resolves to an unmutated export, while the written file's own uses
 * still diagnose the write.
 */
import { expect } from 'vitest'
import { hasWant, type AtomicCaseSpec } from '../../helpers.js'

const spec: AtomicCaseSpec = {
  id: 'ATM-SITE-84',
  verify(result) {
    // The import folds the origin's raw value despite the same-named write.
    expect(hasWant(result, 'color', '#f59e0b')).toBe(true)
    expect(result.wants ?? []).toHaveLength(1)

    // The only diagnostic is the written file's own use naming its write.
    expect(result.diagnostics).toHaveLength(1)
    expect(result.diagnostics).toEqual([
      expect.objectContaining({
        severity: 'warning',
        code: 'ATM-W-MUTATED-BINDING',
      }),
    ])
    expect(result.diagnostics?.[0]?.message).toContain(
      "Dynamic mutated binding 'glow' encountered for prop 'color'",
    )
  },
}

export default spec

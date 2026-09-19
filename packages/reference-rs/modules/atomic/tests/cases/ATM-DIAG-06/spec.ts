/**
 * Unicode-positions station (ATM-DIAG-06, Operation Error Correct Slice 0).
 * RED: columns must count UTF-16 code units and the global-surface
 * diagnostic must carry a location. No panic on non-ASCII source.
 */
import { expect } from 'vitest'
import { hasWant, type AtomicCaseSpec } from '../../helpers.js'

const spec: AtomicCaseSpec = {
  id: 'ATM-DIAG-06',
  verify(result) {
    // No panic, correct extraction: the static sibling extracts and the
    // CJK/accented global selector paints.
    expect(hasWant(result, 'mt', '2r')).toBe(true)
    expect(result.stylesheet).toContain('日本語')
    expect(result.stylesheet).toContain('café')

    const diagnostics = result.diagnostics ?? []
    const warnings = diagnostics.filter(d => d.severity === 'warning')

    // Extract half: the dynamic identifier sits past an emoji on line 3, so
    // its column pins the unit — UTF-16 61, scalar 60, bytes 63.
    const dynamic = warnings.find(d =>
      d.message.startsWith(
        "Dynamic non-literal identifier 'depth' encountered for prop 'color'"
      )
    )
    expect(dynamic, 'missing dynamic-identifier warning').toBeDefined()
    expect(dynamic!.file ?? '').toContain('emoji.ts')
    expect(dynamic!.line).toBe(3)
    expect(dynamic!.column).toBe(61)

    // Global half (RED): the unknown global condition must carry a location.
    // Today global-surface warnings are file-less.
    const global = warnings.find(
      d => d.code === 'ATM-W-UNKNOWN-CONDITION' && d.message.includes('_bogus')
    )
    expect(global, 'missing unknown-global-condition warning').toBeDefined()
    expect(global!.file).toBeDefined()
    expect(global!.line).toBeGreaterThan(0)
    expect(global!.column).toBeGreaterThan(0)

    // The general claim: no diagnostic without a position.
    for (const d of diagnostics) {
      expect(d.file ?? '', `${d.code} carries a file`).toBeTruthy()
      expect(d.line ?? 0, `${d.code} carries a line`).toBeGreaterThan(0)
      expect(d.column ?? 0, `${d.code} carries a column`).toBeGreaterThan(0)
    }
  },
}

export default spec

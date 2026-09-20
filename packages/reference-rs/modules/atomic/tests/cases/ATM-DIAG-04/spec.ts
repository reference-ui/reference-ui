/**
 * Located-diagnostics station (ATM-DIAG-04, Operation Error Correct Slice 0).
 * RED: every diagnostic must carry file+line+column, but token-resolution
 * warnings still carry no position at all.
 */
import { expect } from 'vitest'
import { hasWant, type AtomicCaseSpec } from '../../helpers.js'

const spec: AtomicCaseSpec = {
  id: 'ATM-DIAG-04',
  verify(result) {
    // The static sibling still extracts beside the two refusals.
    expect(hasWant(result, 'mt', '2r')).toBe(true)

    const diagnostics = result.diagnostics ?? []
    const warnings = diagnostics.filter(d => d.severity === 'warning')

    // Extract half (green since ATM-DIAG-05): the dynamic identifier on a
    // known line reports that line and column, not just the path.
    const dynamic = warnings.find(d =>
      d.message.startsWith(
        "Dynamic non-literal identifier 'depth' encountered for prop 'height'"
      )
    )
    expect(dynamic, 'missing dynamic-identifier warning').toBeDefined()
    expect(dynamic!.code).toBe('ATM-W-DYNAMIC-IDENTIFIER')
    expect(dynamic!.file ?? '').toContain('located.ts')
    expect(dynamic!.line).toBe(4)
    expect(dynamic!.column).toBe(11)

    // Resolve half (RED): the token-resolution warning must also carry a
    // location. Today it is file-less.
    const token = warnings.find(d => d.code === 'ATM-W-UNKNOWN-TOKEN-PATH')
    expect(token, 'missing unknown-token-path warning').toBeDefined()
    expect(token!.message).toContain('ui.missing.path')
    expect(token!.file ?? '').toContain('located.ts')
    expect(token!.line).toBeGreaterThan(0)
    expect(token!.column).toBeGreaterThan(0)

    // The general claim: no diagnostic without a position.
    for (const d of diagnostics) {
      expect(d.file ?? '', `${d.code} carries a file`).toBeTruthy()
      expect(d.line ?? 0, `${d.code} carries a line`).toBeGreaterThan(0)
      expect(d.column ?? 0, `${d.code} carries a column`).toBeGreaterThan(0)
    }
  },
}

export default spec

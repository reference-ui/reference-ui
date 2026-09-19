/**
 * Producer-seam station (ATM-DIAG-13, Operation Error Correct Slice 0).
 * RED: one site identity, deterministic order, stable codes, no duplicate
 * final line. Regression for the Objective-1 carry-forward: hover usages
 * emit exactly 2 file-less warnings each.
 */
import { expect } from 'vitest'
import { compileCase, hasWant, type AtomicCaseSpec } from '../../helpers.js'

const lineKey = (d: {
  severity: string
  code: string
  message: string
  file?: string
  line?: number
  column?: number
}): string =>
  [d.severity, d.code, d.message, d.file ?? '', d.line ?? '', d.column ?? ''].join('|')

const spec: AtomicCaseSpec = {
  id: 'ATM-DIAG-13',
  async verify(result) {
    expect(hasWant(result, 'mt', '2r')).toBe(true)

    const diagnostics = result.diagnostics ?? []
    expect(diagnostics.length).toBeGreaterThan(0)

    // RED hinge 1 (regression target): no duplicate final line. The
    // two same-message hover wants must not collapse into identical
    // file-less lines — each line keeps its own site identity.
    const keys = diagnostics.map(lineKey)
    expect(new Set(keys).size, 'duplicate final diagnostic lines').toBe(keys.length)

    // One site identity: every final line carries its source site.
    for (const d of diagnostics) {
      expect(d.file ?? '', `${d.code} carries a file`).toBeTruthy()
      expect(d.line ?? 0, `${d.code} carries a line`).toBeGreaterThan(0)
      expect(d.column ?? 0, `${d.code} carries a column`).toBeGreaterThan(0)
    }

    // Stable codes: every line classifies under the stable code table.
    for (const d of diagnostics) {
      expect(d.code).toMatch(/^ATM-(W|E|I)-/)
    }

    // Deterministic order: a second compile emits the same lines in the
    // same order.
    const again = await compileCase('ATM-DIAG-13')
    expect(again.diagnostics ?? []).toEqual(diagnostics)
  },
}

export default spec

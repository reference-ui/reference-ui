/**
 * Parse-error station. Malformed source records severity error diagnostics
 * and still yields a CompileResult (stylesheet + class map).
 */
import { expect } from 'vitest'
import { LAYER_PREAMBLE, LIB_PACKAGE_OPEN, type AtomicCaseSpec } from '../../helpers.js'

const spec: AtomicCaseSpec = {
  id: 'ATM-DIAG-03',
  verify(result) {
    expect(result.diagnostics.length).toBeGreaterThanOrEqual(1)
    expect(result.diagnostics.some(d => d.severity === 'error')).toBe(true)
    expect(result.stylesheet.startsWith(`${LIB_PACKAGE_OPEN}\n${LAYER_PREAMBLE}`)).toBe(true)
    expect(result.css).toBeTruthy()
  },
}

export default spec

/**
 * Unknown `_hovr` station. The unrecognised condition warns and emits no
 * utility; the sibling property still compiles.
 */
import { expect } from 'vitest'
import { hasWant, type AtomicCaseSpec } from '../../helpers.js'

const spec: AtomicCaseSpec = {
  id: 'ATM-COND-12',
  verify(result) {
    expect(hasWant(result, 'color', 'red.500', ['_hovr'])).toBe(true)
    expect(hasWant(result, 'color', 'blue.500')).toBe(true)
    expect(result.stylesheet).not.toContain('hovr')
    expect(result.stylesheet).not.toContain(':hovr')
    expect(result.stylesheet).toContain('.\\@reference-ui\\/lib__c_blue\\.500')
    expect(result.diagnostics).toHaveLength(1)
    expect(result.diagnostics[0]?.message).toContain('_hovr')
    expect(result.atomCount).toBe(1)
  },
}

export default spec

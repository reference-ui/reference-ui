/**
 * Const copied from an import in the same file (ATM-SITE-110). `v1 = v0` and
 * `v2 = v1` over `v0` imported from `tokens.ts`; `css({ color: v2 })` folds to
 * `red` through the alias chain and plans its class.
 */
import { expect } from 'vitest'
import { hasWant, type AtomicCaseSpec } from '../../harness/helpers.js'

const spec: AtomicCaseSpec = {
  id: 'ATM-SITE-110',
  verify(result) {
    expect(hasWant(result, 'color', 'red')).toBe(true)
    expect(result.css?.classes).toEqual({ 'color:red': '@reference-ui/lib__c_red' })
    expect(result.diagnostics).toEqual([])
  },
}

export default spec

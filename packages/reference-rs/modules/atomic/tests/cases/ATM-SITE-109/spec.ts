/**
 * Const copied from an imported const (ATM-SITE-109). `f1.ts` declares
 * `export const v1 = v0` over `v0` imported from `f0.ts`; the consumer's
 * `css({ color: v1 })` folds to `red` through both files and plans its class.
 */
import { expect } from 'vitest'
import { hasWant, type AtomicCaseSpec } from '../../harness/helpers.js'

const spec: AtomicCaseSpec = {
  id: 'ATM-SITE-109',
  verify(result) {
    expect(hasWant(result, 'color', 'red')).toBe(true)
    expect(result.css?.classes).toEqual({ 'color:red': '@reference-ui/lib__c_red' })
    expect(result.diagnostics).toEqual([])
  },
}

export default spec

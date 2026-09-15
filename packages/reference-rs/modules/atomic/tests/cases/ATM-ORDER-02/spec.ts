/**
 * Bucket station. Unconditioned, then `_hover`, then the `sm` at-rule.
 * Authorship order is at-rule / hover / base; the sorter still buckets.
 */
import { expect } from 'vitest'
import { hasWant, type AtomicCaseSpec } from '../../helpers.js'

const spec: AtomicCaseSpec = {
  id: 'ATM-ORDER-02',
  verify(result) {
    expect(hasWant(result, 'color', 'red')).toBe(true)
    expect(hasWant(result, 'color', 'blue', ['_hover'])).toBe(true)
    expect(hasWant(result, 'color', 'green', ['@container (min-width: 640px)'])).toBe(
      true
    )
    const sheet = result.stylesheet
    const base = sheet.indexOf('.c_red')
    const hover = sheet.indexOf('.hover\\:c_blue')
    const at = sheet.indexOf('@container (min-width: 640px)')
    expect(base).toBeGreaterThan(-1)
    expect(hover).toBeGreaterThan(-1)
    expect(at).toBeGreaterThan(-1)
    expect(base).toBeLessThan(hover)
    expect(hover).toBeLessThan(at)
  },
}

export default spec

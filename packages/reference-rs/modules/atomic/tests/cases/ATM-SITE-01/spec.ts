/**
 * Canon dictionary seam. Style props on real Reference primitives become
 * wants. This case exists so extract does not invent a second tag list.
 */
import { expect } from 'vitest'
import { hasWant, type AtomicCaseSpec } from '../../harness/helpers.js'

const spec: AtomicCaseSpec = {
  id: 'ATM-SITE-01',
  verify(result) {
    expect(hasWant(result, 'mt', '2r')).toBe(true)
    expect(hasWant(result, 'bg', 'blue.500')).toBe(true)
    expect(hasWant(result, 'px', '4r')).toBe(true)
  },
}

export default spec

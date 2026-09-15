/**
 * Responsive-array extract station. Items map onto base/sm/md; null holes
 * skip; a ternary inside an item scoops both arms onto that when.
 */
import { expect } from 'vitest'
import { getWantsForProp, hasWant, type AtomicCaseSpec } from '../../helpers.js'

const spec: AtomicCaseSpec = {
  id: 'ATM-LEAF-05',
  verify(result) {
    expect(hasWant(result, 'mt', '1r', ['base'])).toBe(true)
    expect(hasWant(result, 'mt', '2r', ['sm'])).toBe(true)
    expect(hasWant(result, 'mt', '4r', ['md'])).toBe(true)
    expect(getWantsForProp(result, 'mt')).toHaveLength(3)
    expect(hasWant(result, 'p', '1r', ['base'])).toBe(true)
    expect(hasWant(result, 'p', '4r', ['md'])).toBe(true)
    expect(hasWant(result, 'p', '2r', ['md'])).toBe(true)
    expect(getWantsForProp(result, 'p')).toHaveLength(3)
    expect(hasWant(result, 'padding', '2r', ['base'])).toBe(true)
    expect(hasWant(result, 'padding', '4r', ['md'])).toBe(true)
    expect(result.stylesheet).toContain('.mt_1r { margin-top: var(--spacing-root); }')
    expect(result.stylesheet).toContain('@media screen and (min-width: 40rem)')
    expect(result.diagnostics).toHaveLength(0)
  },
}

export default spec

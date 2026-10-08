/**
 * Nested condition station. Outer-to-inner when order is preserved on the
 * want and in the class-name prefix. Single presets are ATM-COND-02/03.
 */
import { expect } from 'vitest'
import { hasWant, type AtomicCaseSpec } from '../../helpers.js'

const spec: AtomicCaseSpec = {
  id: 'ATM-COND-04',
  verify(result) {
    expect(hasWant(result, 'bg', 'n900', ['_hover', '_dark'])).toBe(true)
    expect(hasWant(result, 'color', 'white', ['_hover', '_dark'])).toBe(true)
    const triple = ['_dark', '_hover', '_focusVisible']
    expect(hasWant(result, 'borderColor', 'gold', triple)).toBe(true)
    expect(hasWant(result, 'outline', '2px solid yellow', triple)).toBe(true)
    expect(result.css?.classes?.['_dark:_hover:_focusVisible:borderColor:gold']).toBe(
      'nested-conditions__dark:hover:focusVisible:bd-c_gold'
    )
  },
}

export default spec

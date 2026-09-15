/**
 * Condition-lowering station. JSX and nested css() pseudos accumulate on
 * when in source order. Goldens show the selector spelling in styles.css.
 */
import { expect } from 'vitest'
import { hasWant, type AtomicCaseSpec } from '../../helpers.js'

const spec: AtomicCaseSpec = {
  id: 'ATM-COND-04',
  ids: ['ATM-COND-04', 'ATM-COND-02'],
  verify(result) {
    expect(hasWant(result, 'color', 'blue.600')).toBe(true)
    expect(hasWant(result, 'color', 'red.500', ['_hover'])).toBe(true)
    expect(hasWant(result, 'bg', 'gray.900', ['_dark'])).toBe(true)
    expect(hasWant(result, 'bg', 'n900', ['_hover', '_dark'])).toBe(true)
    expect(hasWant(result, 'color', 'white', ['_hover', '_dark'])).toBe(true)
    expect(hasWant(result, 'bg', 'n200', ['_hover'])).toBe(true)
    expect(hasWant(result, 'outline', '2px solid', ['_focusVisible'])).toBe(true)
    const triple = ['_dark', '_hover', '_focusVisible']
    expect(hasWant(result, 'borderColor', 'gold', triple)).toBe(true)
    expect(hasWant(result, 'outline', '2px solid yellow', triple)).toBe(true)
    expect(hasWant(result, 'color', 'green', ['_hover'])).toBe(true)
    expect(result.stylesheet).toContain('.hover\\:c_red\\.500:is(:hover, [data-hover])')
  },
}

export default spec

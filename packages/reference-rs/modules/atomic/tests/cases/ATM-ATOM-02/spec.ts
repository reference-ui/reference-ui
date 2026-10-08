/**
 * AtomValue variant station. String, Number, and resolved Token leaves
 * emit distinct class names and CSS declaration values. Bool stays on
 * the want and must not appear as a CSS declaration value.
 */
import { expect } from 'vitest'
import { hasWant, type AtomicCaseSpec } from '../../helpers.js'

const spec: AtomicCaseSpec = {
  id: 'ATM-ATOM-02',
  verify(result) {
    expect(hasWant(result, 'mt', '2r')).toBe(true)
    expect(hasWant(result, 'opacity', 0.5)).toBe(true)
    expect(hasWant(result, 'border', true)).toBe(true)
    expect(hasWant(result, 'color', 'blue.600')).toBe(true)
    expect(result.css?.classes?.['mt:2r']).toBe('@reference-ui/lib__mt_2r')
    expect(result.css?.classes?.['color:blue.600']).toBe('@reference-ui/lib__c_blue.600')
    expect(result.stylesheet).toContain('margin-top: calc(2 * var(--spacing-root));')
    expect(result.stylesheet).toContain('color: var(--colors-blue-600);')
    expect(result.stylesheet).not.toContain('border: true;')
    expect(result.stylesheet).toMatch(/opacity:\s*0\.5;/)
  },
}

export default spec

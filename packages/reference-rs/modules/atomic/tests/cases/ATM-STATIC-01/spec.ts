/**
 * staticCss station. Dump wildcards and lists become utilities and runtime
 * map keys so `bg={prop}` can look up at runtime. AST does not author those
 * literals; the dump is the third want source.
 */
import { expect } from 'vitest'
import { hasWant, type AtomicCaseSpec } from '../../helpers.js'

const spec: AtomicCaseSpec = {
  id: 'ATM-STATIC-01',
  verify(result) {
    expect(hasWant(result, 'color', 'n100')).toBe(true)
    expect(hasWant(result, 'color', 'n200')).toBe(true)
    expect(hasWant(result, 'color', 'n300')).toBe(true)
    expect(hasWant(result, 'bg', 'n100')).toBe(true)
    expect(hasWant(result, 'bg', 'n200')).toBe(true)
    expect(hasWant(result, 'bg', 'n300')).toBe(true)
    expect(hasWant(result, 'borderRadius', 'md')).toBe(false)
    const classes = result.css?.classes ?? {}
    expect(classes['color:n100']).toBe('static-css__c_n100')
    expect(classes['color:n200']).toBe('static-css__c_n200')
    expect(classes['color:n300']).toBe('static-css__c_n300')
    expect(classes['bg:n100']).toBe('static-css__bg_n100')
    expect(classes['bg:n200']).toBe('static-css__bg_n200')
    expect(classes['bg:n300']).toBe('static-css__bg_n300')
    expect(result.stylesheet).toContain('color: var(--colors-n100);')
    expect(result.stylesheet).toContain('background: var(--colors-n300);')
    expect(result.stylesheet).not.toContain('border-radius:')
  },
}

export default spec

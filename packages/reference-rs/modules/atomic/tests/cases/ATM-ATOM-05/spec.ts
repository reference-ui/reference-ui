/**
 * Custom-property station. `--brand-x` compiles as a declaration whose
 * value resolves tokens, under a system-qualified selector.
 * It is never mistaken for a condition key.
 */
import { expect } from 'vitest'
import { hasWant, type AtomicCaseSpec } from '../../helpers.js'

const spec: AtomicCaseSpec = {
  id: 'ATM-ATOM-05',
  verify(result) {
    expect(hasWant(result, '--brand-x', 'red.500')).toBe(true)
    const sheet = result.stylesheet
    expect(sheet).toContain('--brand-x: var(--colors-red-500);')
    expect(sheet).toContain('color: var(--brand-x);')
    expect(sheet).toContain('.\\@reference-ui\\/lib__--brand-x_red\\.500')
    const classes = result.css?.classes ?? {}
    expect(classes['--brand-x:red.500']).toBe('@reference-ui/lib__--brand-x_red.500')
    expect(result.diagnostics).toEqual([])
  },
}

export default spec

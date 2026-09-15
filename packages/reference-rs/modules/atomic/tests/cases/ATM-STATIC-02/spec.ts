/**
 * staticCss overlap station. AST `bg="n300"` and a static list that also
 * includes n300 share one atom / one class. n100 still prints from the dump.
 */
import { expect } from 'vitest'
import { type AtomicCaseSpec } from '../../helpers.js'

const spec: AtomicCaseSpec = {
  id: 'ATM-STATIC-02',
  verify(result) {
    const classes = result.css?.classes ?? {}
    expect(classes['bg:n300']).toBe('bg_n300')
    expect(classes['bg:n100']).toBe('bg_n100')
    expect(Object.keys(classes)).toHaveLength(2)
    expect(result.stylesheet.split('.bg_n300 {').length).toBe(2)
    expect(result.stylesheet.split('.bg_n100 {').length).toBe(2)
  },
}

export default spec

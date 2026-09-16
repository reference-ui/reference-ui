/**
 * AtomSet dedup station. The same `bg="n300"` in two files becomes one
 * class. A distinct `color` atom still appears.
 */
import { expect } from 'vitest'
import { type AtomicCaseSpec } from '../../helpers.js'

const spec: AtomicCaseSpec = {
  id: 'ATM-ATOM-03',
  verify(result) {
    const classes = result.css?.classes ?? {}
    expect(classes['bg:n300']).toBe('atom-dedup__bg_n300')
    expect(classes['color:red']).toBe('atom-dedup__c_red')
    expect(Object.keys(classes)).toHaveLength(2)
    expect(result.stylesheet.split('.atom-dedup__bg_n300 {').length).toBe(2)
  },
}

export default spec

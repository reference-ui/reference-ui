/**
 * Atom hash station. Two files authoring `mt="2r"` emit one class.
 * A different value emits a second class. Importance splits identity.
 */
import { expect } from 'vitest'
import { type AtomicCaseSpec } from '../../helpers.js'

const spec: AtomicCaseSpec = {
  id: 'ATM-ATOM-01',
  verify(result) {
    const classes = result.css?.classes ?? {}
    expect(classes['mt:2r']).toBe('@reference-ui/lib__mt_2r')
    expect(classes['mt:4r']).toBe('@reference-ui/lib__mt_4r')
    const mtClasses = Object.entries(classes).filter(([key]) => key.startsWith('mt:'))
    expect(mtClasses).toHaveLength(2)
    expect(result.stylesheet.split('.\\@reference-ui\\/lib__mt_2r {').length).toBe(2)
  },
}

export default spec

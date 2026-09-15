/**
 * Single-namer tripwire. Every `css.classes` value has an identical escaped
 * selector in the stylesheet. No second spelling.
 */
import { expect } from 'vitest'
import { classSelector, type AtomicCaseSpec } from '../../helpers.js'

const spec: AtomicCaseSpec = {
  id: 'ATM-FORBID-03',
  verify(result) {
    const classes = result.css?.classes ?? {}
    expect(Object.keys(classes).length).toBeGreaterThanOrEqual(2)
    for (const className of Object.values(classes)) {
      expect(result.stylesheet).toContain(classSelector(className))
    }
  },
}

export default spec

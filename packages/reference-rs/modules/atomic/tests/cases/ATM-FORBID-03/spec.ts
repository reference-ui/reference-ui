/**
 * Single-namer tripwire. Every `css.classes` value is a class selector in
 * `@layer utilities`. No second spelling.
 */
import { expect } from 'vitest'
import { layerClassNames, type AtomicCaseSpec } from '../../helpers.js'

const spec: AtomicCaseSpec = {
  id: 'ATM-FORBID-03',
  verify(result) {
    const classes = result.css?.classes ?? {}
    expect(Object.keys(classes).length).toBeGreaterThanOrEqual(2)
    const utilities = layerClassNames(result.stylesheet, 'utilities')
    for (const className of Object.values(classes)) {
      expect(utilities.has(className)).toBe(true)
    }
  },
}

export default spec

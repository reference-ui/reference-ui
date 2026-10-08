/**
 * Property-priority station. `borderColor` precedes `borderBottomColor` and
 * `padding` precedes `paddingTop` in both authorship orders.
 */
import { expect } from 'vitest'
import { type AtomicCaseSpec } from '../../helpers.js'

const spec: AtomicCaseSpec = {
  id: 'ATM-ORDER-04',
  verify(result) {
    const sheet = result.stylesheet
    const borderColor = sheet.indexOf('.order-04__bd-c_gray\\.800')
    const borderBottom = sheet.indexOf('.order-04__bd-b-c_red\\.500')
    const padding = sheet.indexOf('.order-04__p_1r')
    const paddingTop = sheet.indexOf('.order-04__pt_2r')
    expect(borderColor).toBeGreaterThan(-1)
    expect(borderBottom).toBeGreaterThan(-1)
    expect(padding).toBeGreaterThan(-1)
    expect(paddingTop).toBeGreaterThan(-1)
    expect(borderColor).toBeLessThan(borderBottom)
    expect(padding).toBeLessThan(paddingTop)
  },
}

export default spec

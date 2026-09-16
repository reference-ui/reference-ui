/**
 * Shorthand-then-longhand station. Both classes exist; `padding` prints
 * before `paddingTop` regardless of key order in the two source files.
 */
import { expect } from 'vitest'
import { hasWant, type AtomicCaseSpec } from '../../helpers.js'

const spec: AtomicCaseSpec = {
  id: 'ATM-SHORT-06',
  verify(result) {
    expect(hasWant(result, 'padding', '2r')).toBe(true)
    expect(hasWant(result, 'paddingTop', '4r')).toBe(true)
    const sheet = result.stylesheet
    const padding = sheet.indexOf('.short-06__p_2r')
    const paddingTop = sheet.indexOf('.short-06__pt_4r')
    expect(padding).toBeGreaterThan(-1)
    expect(paddingTop).toBeGreaterThan(-1)
    expect(padding).toBeLessThan(paddingTop)
    expect(result.css?.classes?.['padding:2r']).toBe('short-06__p_2r')
    expect(result.css?.classes?.['paddingTop:4r']).toBe('short-06__pt_4r')
  },
}

export default spec

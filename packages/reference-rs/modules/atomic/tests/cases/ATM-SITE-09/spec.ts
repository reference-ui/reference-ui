/**
 * Boolean StyleProps station. A valueless known style attribute becomes
 * AtomValue::Bool(true). String attrs are ATM-SITE-01.
 */
import { expect } from 'vitest'
import { hasWant, type AtomicCaseSpec } from '../../helpers.js'

const spec: AtomicCaseSpec = {
  id: 'ATM-SITE-09',
  verify(result) {
    expect(hasWant(result, 'border', true)).toBe(true)
    const border = (result.wants ?? []).find(w => w.prop === 'border')
    expect(border?.important).toBe(false)
    expect(border?.origin).toBe('Div')
  },
}

export default spec

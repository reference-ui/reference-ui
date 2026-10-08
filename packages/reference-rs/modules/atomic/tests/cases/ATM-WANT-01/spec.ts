/**
 * Want IR station. Compile surfaces property, typed value, when chain,
 * important flag, and origin on each extracted want.
 */
import { expect } from 'vitest'
import { hasWant, type AtomicCaseSpec } from '../../helpers.js'

const spec: AtomicCaseSpec = {
  id: 'ATM-WANT-01',
  verify(result) {
    expect(hasWant(result, 'mt', '2r')).toBe(true)
    expect(hasWant(result, 'color', 'red', ['_hover'])).toBe(true)
    const mt = (result.wants ?? []).find(w => w.prop === 'mt')
    const color = (result.wants ?? []).find(w => w.prop === 'color')
    expect(mt?.value).toEqual({ String: '2r' })
    expect(mt?.important).toBe(true)
    expect(mt?.origin).toBe('Div')
    expect(mt?.when).toEqual([])
    expect(color?.when).toEqual(['_hover'])
    expect(color?.important).toBe(false)
  },
}

export default spec

/**
 * Want serde station. Wants that crossed the native JSON seam round-trip
 * through JSON.stringify/parse without losing prop, value, when, important,
 * or origin.
 */
import { expect } from 'vitest'
import { type AtomicCaseSpec } from '../../helpers.js'

const spec: AtomicCaseSpec = {
  id: 'ATM-WANT-02',
  verify(result) {
    const wants = result.wants ?? []
    expect(wants.length).toBeGreaterThanOrEqual(1)
    const roundtrip = JSON.parse(JSON.stringify(wants))
    expect(roundtrip).toEqual(wants)
    const hover = wants.find(w => w.prop === 'bg')
    expect(hover?.when).toEqual(['_hover'])
    expect(hover?.origin).toBe('css')
    expect(hover?.important).toBe(false)
    expect(hover?.value).toEqual({ String: 'n300' })
  },
}

export default spec

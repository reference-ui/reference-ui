/**
 * Pseudo precedence station. Authored alphabetically so extract order would
 * put `_active` first; the sorter still emits hover → disabled.
 */
import { expect } from 'vitest'
import { type AtomicCaseSpec } from '../../helpers.js'

const ORDER = ['hover', 'focus', 'focusVisible', 'active', 'disabled'] as const

const spec: AtomicCaseSpec = {
  id: 'ATM-ORDER-03',
  verify(result) {
    const sheet = result.stylesheet
    const positions = ORDER.map(name => {
      const i = sheet.indexOf(`.order-03__${name}\\:c_red`)
      expect(i, name).toBeGreaterThan(-1)
      return i
    })
    for (let i = 1; i < positions.length; i++) {
      expect(positions[i]).toBeGreaterThan(positions[i - 1]!)
    }
  },
}

export default spec

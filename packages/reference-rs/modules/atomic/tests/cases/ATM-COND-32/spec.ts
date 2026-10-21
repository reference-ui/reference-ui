/**
 * Range keys are built from breakpoint names (ATM-COND-32).
 * `fooOnly`, `fooDown`, the one-sided `mdToFoo` and the spread `barOnly`
 * are not ranges, so each warns unknown property on the default channel.
 * Real ranges lower to bounded container queries; the backwards `lgToSm`
 * keeps its unknown-condition warning.
 */
import { expect } from 'vitest'
import { type AtomicCaseSpec } from '../../harness/helpers.js'

const BAD_KEYS = ['fooOnly', 'fooDown', 'mdToFoo', 'barOnly', 'lgToSm']

const spec: AtomicCaseSpec = {
  id: 'ATM-COND-32',
  verify(result) {
    const defaults = result.diagnostics ?? []
    const unknownProps = defaults.filter(d => d.code === 'ATM-W-UNKNOWN-PROPERTY')
    expect(unknownProps).toHaveLength(4)
    for (const key of ['fooOnly', 'fooDown', 'mdToFoo', 'barOnly']) {
      expect(
        unknownProps.filter(d => d.message.includes(`"${key}"`)),
        `unknown property ${key}`
      ).toHaveLength(1)
    }
    const unknownConds = defaults.filter(d => d.code === 'ATM-W-UNKNOWN-CONDITION')
    expect(unknownConds).toHaveLength(1)
    expect(unknownConds[0]!.message).toContain('lgToSm')

    const sheet = result.stylesheet
    expect(sheet).toContain('@container (min-width: 768px) and (max-width: 1023.98px)')
    expect(sheet).toContain('@container (max-width: 767.98px)')
    expect(sheet).toContain('@container (min-width: 640px) and (max-width: 1023.98px)')
    const classKeys = Object.keys(result.css?.classes ?? {})
    for (const key of BAD_KEYS) {
      expect(sheet, `sheet names ${key}`).not.toContain(key)
      expect(classKeys.filter(k => k.includes(key)), `class key ${key}`).toHaveLength(0)
    }
  },
}

export default spec

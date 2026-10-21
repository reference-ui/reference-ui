/**
 * Range keys are built from breakpoint names (ATM-COND-32).
 * Keys that only look like ranges warn unknown property once each, on the
 * literal, const-spread and folded-spread paths, and never add a missing-plan
 * line. `navDown` is a real style prop again; real ranges lower to bounded
 * container queries; the backwards `lgToSm` keeps its unknown-condition warning.
 */
import { expect } from 'vitest'
import { type AtomicCaseSpec } from '../../harness/helpers.js'

const UNKNOWN = ['fooOnly', 'fooDown', 'mdToFoo', 'barOnly', 'bazDown', 'quxOnly', 'fooBar']
const BAD_KEYS = [...UNKNOWN, 'lgToSm']

const spec: AtomicCaseSpec = {
  id: 'ATM-COND-32',
  verify(result) {
    const defaults = result.diagnostics ?? []
    const unknownProps = defaults.filter(d => d.code === 'ATM-W-UNKNOWN-PROPERTY')
    expect(unknownProps).toHaveLength(UNKNOWN.length)
    for (const key of UNKNOWN) {
      expect(
        unknownProps.filter(d => d.message.includes(`"${key}"`)),
        `unknown property ${key}`
      ).toHaveLength(1)
    }
    const unknownConds = defaults.filter(d => d.code === 'ATM-W-UNKNOWN-CONDITION')
    expect(unknownConds).toHaveLength(1)
    expect(unknownConds[0]!.message).toContain('lgToSm')
    // One line per bad key: lookups under an unknown-prop key stay silent.
    expect(defaults.filter(d => d.code === 'ATM-W-MISSING-STYLE-PLAN')).toHaveLength(0)
    expect(defaults).toHaveLength(UNKNOWN.length + 1)

    const sheet = result.stylesheet
    expect(sheet).toMatch(/nav-down:\s*auto/)
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

/**
 * Empty-layer station. Reset, base, and recipes stay omitted when the dump
 * has nothing for them. Fixture globalCss and tokens do populate those layers.
 */
import { expect } from 'vitest'
import { LAYER_PREAMBLE, type AtomicCaseSpec } from '../../helpers.js'

const spec: AtomicCaseSpec = {
  id: 'ATM-LAYER-02',
  verify(result) {
    expect(result.stylesheet.startsWith(LAYER_PREAMBLE)).toBe(true)
    expect(result.stylesheet).toContain('@layer utilities')
    expect(result.stylesheet).not.toContain('@layer reset {')
    expect(result.stylesheet).not.toContain('@layer base {')
    expect(result.stylesheet).not.toContain('@layer recipes {')
  },
}

export default spec

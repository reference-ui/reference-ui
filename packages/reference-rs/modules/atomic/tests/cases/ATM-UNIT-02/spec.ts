/**
 * Canonical numeric forms and rejection of non-canonical numbers (ATM-UNIT-02).
 * Asserts that padding: 1 and padding: '1' produce a single canonical
 * system-qualified .p_1 class and rule. Asserts that non-canonical forms
 * (01, Infinity, NaN, 0x10) emit warning diagnostics and are refused.
 */
import { expect } from 'vitest'
import { layerClassNames, type AtomicCaseSpec } from '../../helpers.js'

const spec: AtomicCaseSpec = {
  id: 'ATM-UNIT-02',
  verify(result) {
    const utilities = layerClassNames(result.stylesheet, 'utilities')
    expect(utilities).toContain('@reference-ui/lib__p_1')

    // Count rules matching the qualified .p_1 in stylesheet: must be exactly one
    const p1Matches = result.stylesheet.match(/\.\\@reference-ui\\\/lib__p_1\b/g)
    expect(p1Matches).toHaveLength(1)

    // Non-canonical forms must NOT appear in utilities
    expect(utilities).not.toContain('@reference-ui/lib__m_01')
    expect(utilities).not.toContain('@reference-ui/lib__w_Infinity')
    expect(utilities).not.toContain('@reference-ui/lib__h_NaN')
    expect(utilities).not.toContain('@reference-ui/lib__top_0x10')

    // Diagnostics must report the 4 non-canonical values
    const messages = result.diagnostics.map(d => d.message)
    expect(messages.some(m => m.includes('01'))).toBe(true)
    expect(messages.some(m => m.includes('Infinity'))).toBe(true)
    expect(messages.some(m => m.includes('NaN'))).toBe(true)
    expect(messages.some(m => m.includes('0x10'))).toBe(true)
  },
}

export default spec

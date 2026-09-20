/**
 * Canonical numeric forms and rejection of non-canonical numbers (ATM-UNIT-02).
 * Asserts that padding: 1 and padding: '1' produce a single canonical
 * system-qualified .p_1 class and rule. SPEC-V2-79 arm: finite numeric strings
 * ('1e3', '.5', '01') canonicalize to the numeric atom and dedupe with the
 * bare number. Contrast arm (S20): padded spellings (' 1', '1 ') numerify
 * where v2 keeps them as strings (no trim), and the unparseable spellings
 * (Infinity, NaN, 0x10) refuse with a coded warning where v2 emits
 * invalid CSS. Shortest-tie arm (doom-4 T2): exact ties render the larger
 * magnitude (the oracle breaks away), silently canonical like any number.
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

    // SPEC-V2-79: finite numeric strings dedupe with the bare number.
    expect(utilities).toContain('@reference-ui/lib__p_1000')
    const p1000Matches = result.stylesheet.match(/\.\\@reference-ui\\\/lib__p_1000\b/g)
    expect(p1000Matches).toHaveLength(1)
    expect(result.stylesheet).toContain('padding: 1000px;')
    expect(utilities).toContain('@reference-ui/lib__m_1')
    const m1Matches = result.stylesheet.match(/\.\\@reference-ui\\\/lib__m_1\b/g)
    expect(m1Matches).toHaveLength(1)
    expect(result.stylesheet).toContain('margin: 1px;')
    expect(utilities).toContain('@reference-ui/lib__op_0.5')
    expect(result.stylesheet).toContain('opacity: 0.5;')

    // Shortest ties (doom-4 T2): the class carries the larger magnitude —
    // the witness, its negative, the low-edge tie, and a `{7,8}` tie both
    // sides spell `8`. All four canonicalize silently (diagnostics stay 4).
    expect(utilities).toContain('@reference-ui/lib__w_752396555469991.3')
    expect(result.stylesheet).toContain('width: 752396555469991.3px;')
    expect(utilities).toContain('@reference-ui/lib__top_-1773218474086427.3')
    expect(result.stylesheet).toContain('top: -1773218474086427.3px;')
    expect(utilities).toContain('@reference-ui/lib__top_-595433053192.7813')
    expect(result.stylesheet).toContain('top: -595433053192.7813px;')
    expect(utilities).toContain('@reference-ui/lib__w_1674911018215997.8')
    expect(result.stylesheet).toContain('width: 1674911018215997.8px;')

    // S20 contrast, numerify half: v2's `canonical_number` returns None
    // for '01' (leading-zero guard) and ' 1' (no trim), keeping them as
    // strings; we numerify all four margin spellings (1, '01', ' 1',
    // '1 ') to the one `m_1` rule above, silently.
    const messages = result.diagnostics.map(d => d.message)
    expect(messages.some(m => m.includes('"01"'))).toBe(false)
    expect(messages.some(m => m.includes('" 1"'))).toBe(false)
    expect(messages.some(m => m.includes('"1 "'))).toBe(false)
    expect(result.stylesheet).not.toContain('margin:  1')

    // S20 contrast, refuse half: v2 keeps Infinity/NaN/0x10/'' as strings
    // and emits invalid CSS; we refuse each with a coded warning and
    // mint no utility.
    expect(utilities).not.toContain('@reference-ui/lib__w_Infinity')
    expect(utilities).not.toContain('@reference-ui/lib__h_NaN')
    expect(utilities).not.toContain('@reference-ui/lib__top_0x10')
    expect(result.stylesheet).not.toContain('margin: ;')
    expect(result.diagnostics).toHaveLength(4)
    for (const spelling of ['Infinity', 'NaN', '0x10']) {
      const match = result.diagnostics.find(d => d.message.includes(spelling))
      expect(match, `missing refusal for '${spelling}'`).toBeDefined()
      expect(match!.severity).toBe('warning')
      expect(match!.code).toBe('ATM-W-NON-CANONICAL-NUMERIC')
    }
    const empty = result.diagnostics.find(d => d.message.includes('Empty string'))
    expect(empty, `missing refusal for ''`).toBeDefined()
    expect(empty!.severity).toBe('warning')
    expect(empty!.code).toBe('ATM-W-INVALID-CSS-VALUE')
  },
}

export default spec

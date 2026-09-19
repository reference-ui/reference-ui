/**
 * Token-scalar dedupe station (ATM-SITE-60, SPEC-V2-04 GAP-04b). Numeric
 * `margin: 4` and string `margin: '4'` resolve against the spacing scale
 * identically: the token wins over px, both spellings land on one class,
 * and the sheet carries exactly one rule. Panda twin:
 * `pandacss_stylesheet/tests/atomic.rs`
 * `numeric_and_string_token_values_dedupe_to_one_rule`.
 */
import { expect } from 'vitest'
import {
  getWantsForProp,
  hasWant,
  layerClassNames,
  type AtomicCaseSpec,
} from '../../helpers.js'

const spec: AtomicCaseSpec = {
  id: 'ATM-SITE-60',
  verify(result) {
    // Both spellings arrive as wants; the token resolves both.
    expect(hasWant(result, 'margin', 4)).toBe(true)
    expect(hasWant(result, 'margin', '4')).toBe(true)
    expect(getWantsForProp(result, 'margin')).toHaveLength(2)

    // One class, one rule, token var (never px).
    const classes = result.css?.classes ?? {}
    expect(classes['margin:4']).toBe('spacing-scale__m_4')
    expect(Object.keys(classes)).toHaveLength(1)
    expect(result.stylesheet).toContain('margin: var(--spacing-4);')
    expect(result.stylesheet).not.toContain('margin: 4px;')
    const m4Matches = result.stylesheet.match(/\.spacing-scale__m_4\b/g)
    expect(m4Matches).toHaveLength(1)

    const utilities = layerClassNames(result.stylesheet, 'utilities')
    expect(utilities).toContain('spacing-scale__m_4')

    expect(result.diagnostics).toEqual([])
  },
}

export default spec

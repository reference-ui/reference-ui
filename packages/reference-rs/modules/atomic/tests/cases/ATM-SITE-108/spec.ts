/**
 * Folded JSX spread bag (ATM-SITE-108). `attrs()` folds to a bag of `readOnly`,
 * `onPointerDown`, and `css`. Spread into a JSX host, the bag keeps attribute
 * semantics: the unknown keys stay silent and `css` lowers its colour. The same
 * fold spread into `css()` keeps style-object semantics, so every unknown key
 * still warns there.
 */
import { expect } from 'vitest'
import { hasWant, type AtomicCaseSpec } from '../../harness/helpers.js'

const UNKNOWN = 'ATM-W-UNKNOWN-PROPERTY'
const CONTROL_LINE = 15

const spec: AtomicCaseSpec = {
  id: 'ATM-SITE-108',
  async verify(result) {
    // Only the css() control warns: the JSX spread at line 11 stays silent.
    const rows = (result.diagnostics ?? []).map(d => `${d.line} ${d.code} ${d.message}`)
    expect(rows.sort()).toEqual(
      [
        `${CONTROL_LINE} ${UNKNOWN} Unknown style property "css"`,
        `${CONTROL_LINE} ${UNKNOWN} Unknown style property "onPointerDown"`,
        `${CONTROL_LINE} ${UNKNOWN} Unknown style property "readOnly"`,
      ].sort()
    )

    // The JSX arm lowers: the css colour and the padding sibling both paint.
    expect(hasWant(result, 'color', 'red')).toBe(true)
    expect(hasWant(result, 'padding', '2r')).toBe(true)
  },
}

export default spec

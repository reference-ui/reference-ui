/**
 * Post-attach call-init station (Forge §5). A const bound to a pure-helper
 * call folds exactly like the direct call spelling — scalar, object, and
 * array inits all carry — while an impure-helper init refuses with a
 * diagnostic and keeps its static siblings.
 */
import { expect } from 'vitest'
import { getWantsForProp, hasWant, type AtomicCaseSpec } from '../../helpers.js'

const spec: AtomicCaseSpec = {
  id: 'ATM-SITE-80',
  verify(result) {
    // Scalar init: the folded use paints exactly like the direct call.
    expect(hasWant(result, 'color', 'red')).toBe(true)
    expect(hasWant(result, 'margin', '13r')).toBe(true)
    // Object init: spread and whole-block uses lower alike.
    expect(hasWant(result, 'color', 'teal.600')).toBe(true)
    expect(hasWant(result, 'backgroundColor', 'navy')).toBe(true)
    expect(hasWant(result, 'padding', '4px')).toBe(true)
    // Array init: index reads resolve through the recorded elements.
    expect(hasWant(result, 'marginTop', '4px')).toBe(true)
    expect(hasWant(result, 'marginBottom', '6px')).toBe(true)
    // The refused init keeps its margin sibling; JSX reads the folded init.
    expect(hasWant(result, 'margin', '1r')).toBe(true)
    expect(hasWant(result, 'margin', '2r')).toBe(true)

    expect(getWantsForProp(result, 'color')).toHaveLength(5)
    expect(getWantsForProp(result, 'margin')).toHaveLength(4)
    expect(result.wants ?? []).toHaveLength(14)

    // Plans dedupe by value: red ×3, teal.600 ×2, navy ×2, and 13r ×2 each
    // share one plan.
    expect(result.runtime.stylePlans).toHaveLength(9)

    const sheet = result.stylesheet
    expect(sheet).toContain('color: red;')
    expect(sheet).toContain('margin: calc(13 * var(--spacing-root));')
    expect(sheet).toContain('margin-top: 4px;')

    expect(result.diagnostics).toEqual([
      expect.objectContaining({
        severity: 'warning',
        code: 'ATM-W-DYNAMIC-IDENTIFIER',
        message: "Dynamic non-literal identifier 'unlucky' encountered for prop 'color'",
      }),
    ])
  },
}

export default spec

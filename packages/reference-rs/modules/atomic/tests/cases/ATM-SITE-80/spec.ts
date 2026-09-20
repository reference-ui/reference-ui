/**
 * Post-attach call-init station (Forge §5). A const bound to a pure-helper
 * call folds exactly like the direct call spelling — scalar, object, and
 * array inits all carry — while an impure-helper init refuses with a
 * diagnostic and keeps its static siblings.
 */
import { expect } from 'vitest'
import {
  compileCase,
  getWantsForProp,
  harvestWants,
  hasWant,
  siteWants,
  type AtomicCaseSpec,
} from '../../helpers.js'

const spec: AtomicCaseSpec = {
  id: 'ATM-SITE-80',
  async verify(result) {
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

    // The refused init position harvests navy; red twins the site atom.
    expect(siteWants(result).filter(w => w.prop === 'color')).toHaveLength(5)
    expect(getWantsForProp(result, 'color')).toHaveLength(6)
    expect(getWantsForProp(result, 'margin')).toHaveLength(4)
    expect(harvestWants(result)).toHaveLength(1)
    expect(result.wants ?? []).toHaveLength(15)

    // Plans dedupe by value: red ×3, teal.600 ×2, navy ×2, and 13r ×2 each
    // share one plan.
    expect(result.stylePlans).toHaveLength(10)

    const sheet = result.stylesheet
    expect(sheet).toContain('color: red;')
    expect(sheet).toContain('margin: calc(13 * var(--spacing-root));')
    expect(sheet).toContain('margin-top: 4px;')

    // Refusal + sink info ride the opt-in channel now (S6 E8-class
    // re-point); the default is silent.
    expect(result.diagnostics ?? []).toHaveLength(0)
    const opted = await compileCase('ATM-SITE-80', { logs: ['compiler'] })
    expect(opted.compilerDiagnostics, 'opt-in channel populates').toBeDefined()
    const moved = (opted.compilerDiagnostics ?? []).filter(
      d => d.code !== 'ATM-I-EXPECTED-LOOKUP' && d.code !== 'ATM-I-DYNAMIC-SLOT'
    )
    expect(moved).toEqual([
      expect.objectContaining({
        severity: 'warning',
        code: 'ATM-W-DYNAMIC-IDENTIFIER',
        message: "Dynamic non-literal identifier 'unlucky' encountered for prop 'color'",
      }),
      expect.objectContaining({
        severity: 'info',
        code: 'ATM-I-HARVEST-SINK',
        message: 'color under []: 1 harvested value minted',
      }),
    ])
  },
}

export default spec

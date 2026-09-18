/**
 * Placeholder/file/checked twin station (ATM-COND-18, RS-17). `_placeholder`
 * prints `::placeholder` plus the `[data-placeholder]` twin, `_file` lowers
 * to `::file-selector-button` instead of warning unknown, and `_checked`
 * keeps the four-member lib twin list. All three wants resolve to plans.
 */
import { expect } from 'vitest'
import { hasWant, type AtomicCaseSpec } from '../../helpers.js'

const SYSTEM = '@reference-ui/lib'
const ESC = '\\@reference-ui\\/lib'

const spec: AtomicCaseSpec = {
  id: 'ATM-COND-18',
  verify(result) {
    expect(hasWant(result, 'color', 'red.500', ['_placeholder'])).toBe(true)
    expect(hasWant(result, 'color', 'blue.500', ['_file'])).toBe(true)
    expect(hasWant(result, 'color', 'green.500', ['_checked'])).toBe(true)

    const sheet = result.stylesheet
    expect(sheet).toContain(
      `.${ESC}__placeholder\\:c_red\\.500::placeholder, .${ESC}__placeholder\\:c_red\\.500[data-placeholder]`,
    )
    expect(sheet).toContain(
      `.${ESC}__file\\:c_blue\\.500::file-selector-button`,
    )
    expect(sheet).toContain(
      `.${ESC}__checked\\:c_green\\.500:is(:checked, [data-checked], [aria-checked=true], [data-state="checked"])`,
    )

    const plans = result.runtime.stylePlans
    expect(plans).toHaveLength(3)
    for (const [when, cls] of [
      ['_placeholder', `${SYSTEM}__placeholder:c_red.500`],
      ['_file', `${SYSTEM}__file:c_blue.500`],
      ['_checked', `${SYSTEM}__checked:c_green.500`],
    ] as const) {
      const plan = plans.find(p => p.when.join() === when)
      expect(plan).toBeDefined()
      expect(plan!.declarations.map(d => d.className)).toContain(cls)
    }

    expect(result.diagnostics).toEqual([])
  },
}

export default spec

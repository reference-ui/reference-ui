/**
 * Supports-routing station (ATM-COND-19, RS-15). `@supports` keys lower to
 * at-rules: `@supports` nests outside `@container` with the pseudo on the
 * selector, never a `:@supports` selector fragment. Supports sorts first.
 */
import { expect } from 'vitest'
import { hasWant, type AtomicCaseSpec } from '../../helpers.js'

const SYSTEM = '@reference-ui/lib'
const WHEN = '@supports (display: grid)'

const spec: AtomicCaseSpec = {
  id: 'ATM-COND-19',
  verify(result) {
    expect(hasWant(result, 'color', 'red.500', [WHEN, 'sm', '&:hover'])).toBe(true)

    const sheet = result.stylesheet
    const supports = sheet.indexOf('@supports (display: grid) {')
    const container = sheet.indexOf('@container (min-width: 640px) {')
    const rule = sheet.indexOf(':hover { color: var(--colors-red-500); }')
    expect(supports).toBeGreaterThan(-1)
    expect(container).toBeGreaterThan(supports)
    expect(rule).toBeGreaterThan(container)
    expect(sheet).not.toContain(':@supports')

    const cls = `${SYSTEM}__[@supports_(display:_grid)]:sm:[&:hover]:c_red.500`
    expect(sheet).toContain(`.${cls.replace(/([@/:.[\]()&])/g, '\\$1')}:hover`)
    expect(result.css?.classes).toEqual({
      [`${WHEN}:sm:&:hover:color:red.500`]: cls,
    })

    const plans = result.runtime.stylePlans
    expect(plans).toHaveLength(1)
    expect(plans[0]!.when).toEqual([WHEN, 'sm', '&:hover'])
    expect(plans[0]!.declarations.map(d => d.className)).toContain(cls)

    expect(result.diagnostics).toEqual([])
  },
}

export default spec

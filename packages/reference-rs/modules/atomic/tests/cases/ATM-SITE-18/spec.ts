/**
 * Boolean-macro station (ATM-SITE-18, RS-19). `<Div border />` emits the
 * width + style utilities with one plan resolving both declarations, like
 * the `container: true` precedent. `color={true}` still warns and skips.
 */
import { expect } from 'vitest'
import { createStylePlanIndex, mergeStylePlans } from '../../../js/index.js'
import { hasWant, type AtomicCaseSpec } from '../../helpers.js'

const SYSTEM = '@reference-ui/lib'
const WIDTH = `${SYSTEM}__bd-w_1px`
const STYLE = `${SYSTEM}__border-style_solid`

const spec: AtomicCaseSpec = {
  id: 'ATM-SITE-18',
  verify(result) {
    expect(hasWant(result, 'border', true)).toBe(true)

    const sheet = result.stylesheet
    expect(sheet).toContain('border-width: 1px;')
    expect(sheet).toContain('border-style: solid;')
    expect(result.css?.classes).toEqual({
      'borderStyle:solid': STYLE,
      'borderWidth:1px': WIDTH,
    })

    const plans = result.runtime.stylePlans
    expect(plans).toHaveLength(1)
    expect(plans[0]).toMatchObject({ prop: 'border', value: true })
    expect(plans[0]!.declarations.map(d => d.className).sort()).toEqual(
      [STYLE, WIDTH].sort(),
    )

    const index = createStylePlanIndex(result.runtime)
    expect(
      mergeStylePlans(index, [{ system: SYSTEM, when: [], prop: 'border', value: true }]),
    ).toBe([WIDTH, STYLE].sort().join(' '))

    const warnings = result.diagnostics.map(d => d.message)
    expect(warnings).toEqual([
      '`color: true` has no compiled style plan; this lookup will emit no class. `color` value `true` is not valid CSS',
    ])
    expect(
      Object.values(result.css?.classes ?? {}).some(c => String(c).includes('color')),
    ).toBe(false)
  },
}

export default spec

/**
 * Condition-prefix class-name station. `_hover` and `_dark`+_hover` become
 * `hover:` / `dark:hover:` prefixes on the runtime class string.
 */
import { expect } from 'vitest'
import { type AtomicCaseSpec } from '../../helpers.js'

const spec: AtomicCaseSpec = {
  id: 'ATM-NAME-02',
  verify(result) {
    expect(result.css?.classes?.['_hover:bg:n300']).toBe(
      'condition-prefix__hover:bg_n300'
    )
    expect(result.css?.classes?.['_dark:_hover:bg:n300']).toBe(
      'condition-prefix__dark:hover:bg_n300'
    )
    // Twin catalog: the `_x` member mints through the twin of authored
    // `__x` while the plan survives carrying the full object value, so
    // the runtime namer must mint it too (NEO-NAMER-01).
    const twinPlan = result.stylePlans.find(
      p =>
        p.prop === 'color' &&
        (p.value as Record<string, string>)?.md === 'n300'
    )
    expect(twinPlan?.value).toEqual({ _x: 'n300', md: 'n300' })
    expect(twinPlan?.declarations).toHaveLength(2)
    expect(twinPlan?.declarations[0]?.slot).toBe('x:color')
    expect(twinPlan?.declarations[1]?.slot).toBe('color@md')
    expect(result.css?.classes?.['_x:color:n300']).toBe(
      'condition-prefix__x:c_n300'
    )
    expect(result.css?.classes?.['md:color:n300']).toBe(
      'condition-prefix__md:c_n300'
    )
    expect(result.stylesheet).toContain('[data-x]')
  },
}

export default spec

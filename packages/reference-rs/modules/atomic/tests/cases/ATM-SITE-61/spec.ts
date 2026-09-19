/**
 * Value-unwrap station (ATM-SITE-61, SPEC-V2-05 GAP-05a). Parens, `as`,
 * `satisfies`, and postfix `!` are transparent in value position: each
 * wrapped value extracts exactly like the bare literal, nested wrappers
 * unwrap through every layer, and JSX style attrs unwrap the same way.
 * Plans agree with wants on every arm (GAP-05b transparent-in-both),
 * including `!` which carries no important flag. Panda twins:
 * `calls.rs` `nested_unwraps_and_folding`, `jsx.rs` wrap arms.
 */
import { expect } from 'vitest'
import { hasWant, type AtomicCaseSpec } from '../../helpers.js'

const SYSTEM = '@reference-ui/lib'

const spec: AtomicCaseSpec = {
  id: 'ATM-SITE-61',
  verify(result) {
    // All four wraps resolve to their inner value.
    expect(hasWant(result, 'width', '5px')).toBe(true)
    expect(hasWant(result, 'height', '10px')).toBe(true)
    expect(hasWant(result, 'color', 'red')).toBe(true)
    expect(hasWant(result, 'padding', '3px')).toBe(true)

    // Nested wrappers collapse to the literal.
    expect(hasWant(result, 'top', '9px')).toBe(true)

    // JSX style attrs unwrap like css() values.
    expect(hasWant(result, 'mt', '2r')).toBe(true)

    // Closed classes resolve for every arm.
    expect(result.css?.classes?.['width:5px']).toBe(`${SYSTEM}__w_5px`)
    expect(result.css?.classes?.['height:10px']).toBe(`${SYSTEM}__h_10px`)
    expect(result.css?.classes?.['color:red']).toBe(`${SYSTEM}__c_red`)
    expect(result.css?.classes?.['padding:3px']).toBe(`${SYSTEM}__p_3px`)
    expect(result.css?.classes?.['top:9px']).toBe(`${SYSTEM}__top_9px`)
    expect(result.css?.classes?.['mt:2r']).toBe(`${SYSTEM}__mt_2r`)

    const sheet = result.stylesheet
    expect(sheet).toContain('width: 5px;')
    expect(sheet).toContain('height: 10px;')
    expect(sheet).toContain('padding: 3px;')
    expect(sheet).toContain('top: 9px;')
    expect(sheet).not.toContain('!important')

    // Plans agree with wants on every arm; `!` is transparent, not important.
    const plans = result.runtime?.stylePlans ?? []
    expect(plans.length).toBeGreaterThanOrEqual(6)
    for (const plan of plans) {
      expect(plan.important).toBe(false)
    }
    const paddingPlan = plans.find(p => p.prop === 'padding')
    expect(paddingPlan?.value).toBe('3px')
    expect(paddingPlan?.important).toBe(false)

    expect(result.diagnostics).toEqual([])
  },
}

export default spec

/**
 * Call-discovery station (SPEC-V2-38 discovery half). Literal `css()` calls
 * inside function bodies and JSX expression containers extract; several
 * calls in one source each extract; multi-arg `css()` merges every arg.
 */
import { expect } from 'vitest'
import { createStylePlanIndex, mergeStylePlans } from '../../../js/index.js'
import { hasWant, type AtomicCaseSpec } from '../../helpers.js'

const SYSTEM = '@reference-ui/lib'

const spec: AtomicCaseSpec = {
  id: 'ATM-SITE-73',
  verify(result) {
    expect(hasWant(result, 'color', 'red')).toBe(true)
    expect(hasWant(result, 'fontWeight', 'bold')).toBe(true)
    expect(hasWant(result, 'padding', '4px')).toBe(true)
    expect(hasWant(result, 'margin', '1r')).toBe(true)
    expect(hasWant(result, 'borderWidth', '1px')).toBe(true)
    expect(hasWant(result, 'borderStyle', 'solid')).toBe(true)
    expect(hasWant(result, 'borderColor', 'black')).toBe(true)
    expect(hasWant(result, 'opacity', '0.5')).toBe(true)

    const plans = result.runtime.stylePlans
    for (const [prop, value] of [
      ['color', 'red'],
      ['fontWeight', 'bold'],
      ['padding', '4px'],
      ['margin', '1r'],
      ['borderWidth', '1px'],
      ['borderStyle', 'solid'],
      ['borderColor', 'black'],
      ['opacity', '0.5'],
    ] as const) {
      expect(
        plans.find(p => p.prop === prop && String(p.value) === value),
      ).toBeDefined()
    }

    const index = createStylePlanIndex(result.runtime)
    expect(
      mergeStylePlans(index, [{ system: SYSTEM, prop: 'opacity', value: '0.5' }]),
    ).toBe(`${SYSTEM}__op_0.5`)

    expect(result.diagnostics).toHaveLength(0)
  },
}

export default spec

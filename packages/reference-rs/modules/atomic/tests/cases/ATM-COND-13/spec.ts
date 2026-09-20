/**
 * Breakpoint range conditions lower to bounded queries.
 */
import { expect } from 'vitest'
import { type AtomicCaseSpec } from '../../helpers.js'

const spec: AtomicCaseSpec = {
  id: 'ATM-COND-13',
  verify(result) {
    const sheet = result.stylesheet
    expect(sheet).toContain('@container (max-width: 767.98px)')
    expect(sheet).toContain('@container (min-width: 768px) and (max-width: 1023.98px)')
    expect(sheet).toContain('@container (min-width: 640px) and (max-width: 1023.98px)')
    expect(
      result.diagnostics.some(
        d => d.severity === 'warning' && d.message.includes('watDown')
      )
    ).toBe(true)
    expect(sheet).not.toContain('watDown')
    // Non-bare custom widths: the Down and Between members drop with a
    // warning while their plans survive carrying the full object value,
    // so the runtime namer must drop them too (NEO-NAMER-01).
    const colorPlan = result.stylePlans.find(
      p => p.prop === 'color' && (p.value as Record<string, string>)?.md === 'blue.500'
    )
    expect(colorPlan?.value).toEqual({ tabletDown: 'red.500', md: 'blue.500' })
    expect(colorPlan?.declarations).toHaveLength(1)
    expect(colorPlan?.declarations[0]?.slot).toBe('color@md')
    const marginPlan = result.stylePlans.find(
      p => p.prop === 'marginTop' && (p.value as Record<string, string>)?.lg === '2r'
    )
    expect(marginPlan?.value).toEqual({ smTotablet: '1r', lg: '2r' })
    expect(marginPlan?.declarations).toHaveLength(1)
    expect(marginPlan?.declarations[0]?.slot).toBe('marginTop@lg')
    expect(sheet).not.toContain('tabletDown')
    expect(sheet).not.toContain('smTotablet')
    expect(
      result.diagnostics.some(
        d => d.severity === 'warning' && d.message.includes('tabletDown')
      )
    ).toBe(true)
    expect(
      result.diagnostics.some(
        d => d.severity === 'warning' && d.message.includes('smTotablet')
      )
    ).toBe(true)
  },
}

export default spec

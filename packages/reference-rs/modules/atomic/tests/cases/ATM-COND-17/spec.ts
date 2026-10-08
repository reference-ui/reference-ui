/**
 * Per-prop responsive object station (ATM-COND-17, RS-9).
 * `width: { base, md }` expands onto breakpoint whens with `base`
 * unconditioned; unknown keys warn and skip; plans carry responsive `@`
 * slots keyed by authored spellings, and a later alias evicts the earlier
 * responsive expansion at merge time (symmetrically: a later responsive
 * expansion evicts an earlier bare alias).
 */
import { expect } from 'vitest'
import { createStylePlanIndex, mergeStylePlans } from '../../../js/index.js'
import { hasWant, layerClassNames, type AtomicCaseSpec } from '../../helpers.js'

const SYSTEM = '@reference-ui/lib'

const spec: AtomicCaseSpec = {
  id: 'ATM-COND-17',
  verify(result) {
    expect(hasWant(result, 'width', '50px', ['base'])).toBe(true)
    expect(hasWant(result, 'width', '60px', ['md'])).toBe(true)
    expect(hasWant(result, 'w', '70px')).toBe(true)
    expect(hasWant(result, 'width', '51px', ['base'])).toBe(true)
    expect(hasWant(result, 'width', '61px', ['wat'])).toBe(true)

    const utilities = layerClassNames(result.stylesheet, 'utilities')
    expect(utilities).toContain('@reference-ui/lib__w_50px')
    expect(utilities).toContain('@reference-ui/lib__md:w_60px')
    expect(utilities).toContain('@reference-ui/lib__w_70px')
    expect(utilities).toContain('@reference-ui/lib__w_51px')
    expect(result.stylesheet).toContain('@container (min-width: 768px)')
    expect(result.stylesheet).not.toContain('61px')

    const widthPlan = result.stylePlans.find(
      p => p.prop === 'width' && (p.value as Record<string, string>)?.md === '60px'
    )
    expect(widthPlan).toBeDefined()
    expect(widthPlan!.when).toEqual([])
    expect(widthPlan!.value).toEqual({ base: '50px', md: '60px' })
    expect(widthPlan!.declarations).toEqual([
      { slot: 'width@base', className: '@reference-ui/lib__w_50px' },
      { slot: 'width@md', className: '@reference-ui/lib__md:w_60px' },
    ])
    const wPlan = result.stylePlans.find(
      p => p.prop === 'w' && p.value === '70px'
    )
    expect(wPlan).toBeDefined()
    expect(wPlan!.declarations).toEqual([
      { slot: 'width', className: '@reference-ui/lib__w_70px' },
    ])

    const index = createStylePlanIndex(result.stylePlans)
    const evicted = mergeStylePlans(index, [
      { system: SYSTEM, prop: 'width', value: { base: '50px', md: '60px' } },
      { system: SYSTEM, prop: 'w', value: '70px' },
    ])
    expect(evicted).toBe('@reference-ui/lib__w_70px')
    const responsiveWins = mergeStylePlans(index, [
      { system: SYSTEM, prop: 'w', value: '70px' },
      { system: SYSTEM, prop: 'width', value: { base: '50px', md: '60px' } },
    ])
    expect(responsiveWins).toBe('@reference-ui/lib__w_50px @reference-ui/lib__md:w_60px')

    expect(result.diagnostics).toHaveLength(1)
    expect(result.diagnostics[0]?.message).toContain('wat')
  },
}

export default spec

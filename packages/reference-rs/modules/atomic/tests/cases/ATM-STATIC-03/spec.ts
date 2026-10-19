/**
 * Static CSS conditions, non-color wildcards, and unknown property diagnostics.
 * Wants and style plans cover the hover color and radius wildcards; `unknownProp` warns.
 */
import { expect } from 'vitest'
import { hasWant, type AtomicCaseSpec } from '../../harness/helpers.js'

const spec: AtomicCaseSpec = {
  id: 'ATM-STATIC-03',
  verify(result) {
    expect(hasWant(result, 'color', 'n100', ['_hover'])).toBe(true)
    expect(hasWant(result, 'borderRadius', 'sm')).toBe(true)
    expect(hasWant(result, 'borderRadius', 'md')).toBe(true)
    expect(result.stylesheet).toContain(
      '.static-wildcard__hover\\:c_n100:is(:hover, [data-hover])'
    )
    expect(result.stylesheet).toContain('.static-wildcard__rounded_sm')
    expect(result.stylesheet).toContain('.static-wildcard__rounded_md')
    expect(result.stylePlans.some(p => p.prop === 'borderRadius')).toBe(true)
    expect(result.stylePlans.some(p => p.prop === 'color')).toBe(true)
    expect(
      result.diagnostics.some(
        d => d.severity === 'warning' && d.message.includes('unknownProp')
      )
    ).toBe(true)
  },
}

export default spec

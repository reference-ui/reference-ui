/**
 * Fenced pure-helper station (ATM-SITE-31, SPEC-V2-39). Closed helpers fold
 * in value position and spread object returns into css() and JSX, while
 * fence edges refuse with a diagnostic and keep their static siblings.
 */
import { expect } from 'vitest'
import { getWantsForProp, hasWant, type AtomicCaseSpec } from '../../helpers.js'

const spec: AtomicCaseSpec = {
  id: 'ATM-SITE-31',
  verify(result) {
    expect(hasWant(result, 'color', 'red')).toBe(true)
    expect(hasWant(result, 'width', '4px')).toBe(true)
    expect(hasWant(result, 'color', 'purple.500')).toBe(true)
    expect(hasWant(result, 'backgroundColor', 'blue.700')).toBe(true)
    expect(hasWant(result, 'color', 'yellow.700')).toBe(true)
    expect(hasWant(result, 'color', 'purple.900')).toBe(true)
    expect(hasWant(result, 'color', 'teal.600')).toBe(true)
    expect(hasWant(result, 'color', 'white')).toBe(true)
    expect(hasWant(result, 'color', 'black')).toBe(true)
    expect(hasWant(result, 'backgroundColor', 'blue')).toBe(true)
    expect(hasWant(result, 'backgroundColor', 'navy')).toBe(true)
    expect(hasWant(result, 'padding', '4px')).toBe(true)
    expect(hasWant(result, 'color', 'red.600')).toBe(true)
    for (const value of ['1r', '2r', '3r', '4r', '5r', '6r', '7r', '8r']) {
      expect(hasWant(result, 'margin', value)).toBe(true)
    }
    expect(getWantsForProp(result, 'color')).toHaveLength(14)
    expect(result.wants ?? []).toHaveLength(30)

    // Plans dedupe by value: 30 wants collapse to 21 unique plans (the
    // binary-arg width reuses the 4px plan; the r7 margin mints 8r).
    expect(result.runtime.stylePlans).toHaveLength(21)

    const diagnostics = result.diagnostics ?? []
    expect(diagnostics).toHaveLength(7)
    for (const diagnostic of diagnostics) {
      expect(diagnostic.severity).toBe('warning')
    }
    const codes = diagnostics.map(diagnostic => diagnostic.code)
    expect(codes.filter(code => code === 'ATM-W-DYNAMIC-EXPRESSION')).toHaveLength(5)
    expect(codes.filter(code => code === 'ATM-W-MUTATED-BINDING')).toHaveLength(1)
    expect(codes.filter(code => code === 'ATM-W-DYNAMIC-IDENTIFIER')).toHaveLength(1)
    expect(
      diagnostics.some(
        diagnostic =>
          diagnostic.code === 'ATM-W-MUTATED-BINDING' &&
          diagnostic.message.includes("'shifting'") &&
          diagnostic.message.includes('reassigned at'),
      ),
    ).toBe(true)

    expect(result.stylesheet).toContain('margin: var(--spacing-root);')
  },
}

export default spec

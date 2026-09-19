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
    // 39-F2/F3 refuse pins keep their margin siblings, colors refused.
    for (const value of ['9r', '10r', '11r', '12r', '13r']) {
      expect(hasWant(result, 'margin', value)).toBe(true)
    }
    expect(hasWant(result, 'color', 'x')).toBe(false)
    expect(hasWant(result, 'color', 'a')).toBe(false)
    expect(hasWant(result, 'color', 'b')).toBe(false)
    // Cross-file arms (SPEC-V2-57): the imported arrow mints a new value,
    // the decl/width/spread arms reuse proven values, the impure arm refuses.
    expect(hasWant(result, 'color', 'orange.600')).toBe(true)
    expect(hasWant(result, 'margin', '14r')).toBe(true)
    // Binding-walk arms (SPEC-V2-57, Ph4 fix): collision, barrels, bare,
    // alias, re-export. Each resolves by binding, never the name bag.
    expect(hasWant(result, 'color', 'coral')).toBe(true)
    expect(hasWant(result, 'backgroundColor', 'gold')).toBe(true)
    expect(hasWant(result, 'color', 'gold')).toBe(false)
    expect(hasWant(result, 'backgroundColor', 'coral')).toBe(false)
    expect(hasWant(result, 'color', '#aa1111')).toBe(true)
    expect(hasWant(result, 'backgroundColor', '#bb2222')).toBe(true)
    expect(hasWant(result, 'color', 'bare.600')).toBe(false)
    expect(hasWant(result, 'margin', '15r')).toBe(true)
    expect(hasWant(result, 'color', 'green.600')).toBe(true)
    expect(hasWant(result, 'color', 'violet.600')).toBe(true)
    expect(hasWant(result, 'color', 'indigo.600')).toBe(true)
    expect(hasWant(result, 'backgroundColor', 'yellow.700')).toBe(true)
    expect(getWantsForProp(result, 'color')).toHaveLength(22)
    expect(result.wants ?? []).toHaveLength(51)

    // Plans dedupe by value: 51 wants collapse to 37 unique plans (the
    // binary-arg width reuses the 4px plan; each new margin mints its own;
    // orange.600 and 14r mint theirs; the walk arms mint 9: 8 fresh values
    // plus backgroundColor yellow.700 beside the color plan).
    expect(result.runtime.stylePlans).toHaveLength(37)

    const diagnostics = result.diagnostics ?? []
    expect(diagnostics).toHaveLength(14)
    for (const diagnostic of diagnostics) {
      expect(diagnostic.severity).toBe('warning')
    }
    const codes = diagnostics.map(diagnostic => diagnostic.code)
    expect(codes.filter(code => code === 'ATM-W-DYNAMIC-EXPRESSION')).toHaveLength(11)
    expect(codes.filter(code => code === 'ATM-W-MUTATED-BINDING')).toHaveLength(1)
    expect(codes.filter(code => code === 'ATM-W-DYNAMIC-IDENTIFIER')).toHaveLength(2)
    expect(
      diagnostics.some(
        diagnostic =>
          diagnostic.code === 'ATM-W-DYNAMIC-EXPRESSION' &&
          (diagnostic.file ?? '').endsWith('xbare.ts') &&
          diagnostic.line != null &&
          diagnostic.column != null
      )
    ).toBe(true)
    expect(
      diagnostics.some(
        diagnostic =>
          diagnostic.code === 'ATM-W-MUTATED-BINDING' &&
          diagnostic.message.includes("'shifting'") &&
          diagnostic.message.includes('reassigned at')
      )
    ).toBe(true)

    expect(result.stylesheet).toContain('margin: var(--spacing-root);')
  },
}

export default spec

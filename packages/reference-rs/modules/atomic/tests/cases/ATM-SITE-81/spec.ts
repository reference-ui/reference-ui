/**
 * Member-path object station (Forge §13). A const bound to a nested style
 * object carries its entries: the alias lowers as a JSX condition block and
 * spreads into `css()` exactly like the member it abbreviates, and member
 * spreads record through const object inits. A write to the root poisons
 * the alias with a located diagnostic instead of resolving stale.
 */
import { expect } from 'vitest'
import { getWantsForProp, hasWant, type AtomicCaseSpec } from '../../helpers.js'

const spec: AtomicCaseSpec = {
  id: 'ATM-SITE-81',
  verify(result) {
    // Alias as a JSX condition block: identical to the inline spelling.
    expect(hasWant(result, 'outline', '2px solid')).toBe(true)
    expect(hasWant(result, 'outlineColor', 'ui.focus.ring')).toBe(true)
    expect(hasWant(result, 'outlineOffset', '2px')).toBe(true)
    expect(hasWant(result, 'color', 'red')).toBe(true)
    // Alias spread into css(): the same entries, unconditioned.
    expect(hasWant(result, 'padding', '4px')).toBe(true)
    // Member spread through a const init, and direct at the use site.
    expect(hasWant(result, 'color', 'blue.700')).toBe(true)
    expect(hasWant(result, 'backgroundColor', 'gray.100')).toBe(true)
    expect(hasWant(result, 'margin', '2r')).toBe(true)
    expect(hasWant(result, 'margin', '3r')).toBe(true)
    expect(hasWant(result, 'borderWidth', '1px')).toBe(true)
    // The poisoned alias drops with its sibling kept; the stale color never paints.
    expect(hasWant(result, 'margin', '4r')).toBe(true)
    expect(hasWant(result, 'margin', '5r')).toBe(true)
    expect(hasWant(result, 'color', 'green.600')).toBe(false)

    expect(result.wants ?? []).toHaveLength(17)

    const sheet = result.stylesheet
    expect(sheet).toContain('outline-color: var(--colors-ui-focus-ring);')
    expect(sheet).toContain('color: var(--colors-blue-700);')

    // The alias drops as an unfoldable spread (existing alias vocabulary);
    // the member spread names the write to the root.
    expect(result.diagnostics).toEqual([
      expect.objectContaining({
        severity: 'warning',
        code: 'ATM-W-UNFOLDABLE-SPREAD',
      }),
      expect.objectContaining({
        severity: 'warning',
        code: 'ATM-W-MUTATED-BINDING',
        message: expect.stringContaining("'live'"),
      }),
    ])
  },
}

export default spec

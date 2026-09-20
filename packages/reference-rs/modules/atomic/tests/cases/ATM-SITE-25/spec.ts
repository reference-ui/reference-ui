/**
 * Merge-list station (ATM-SITE-25, SPEC-V2-29). Call-form `css([...])`
 * merges object elements into unconditioned wants and skips falsy holes
 * silently — never responsive. One want and one runtime plan per leaf;
 * zero diagnostics.
 */
import { expect } from 'vitest'
import { hasWant, type AtomicCaseSpec } from '../../helpers.js'

const spec: AtomicCaseSpec = {
  id: 'ATM-SITE-25',
  verify(result) {
    expect(hasWant(result, 'margin', '1r', [])).toBe(true)
    expect(hasWant(result, 'margin', '3r', [])).toBe(true)
    expect(hasWant(result, 'color', 'red', [])).toBe(true)
    expect(hasWant(result, 'color', 'blue', [])).toBe(true)
    expect(hasWant(result, 'color', 'green', [])).toBe(true)
    expect(hasWant(result, 'color', 'purple', [])).toBe(true)
    expect(result.wants ?? []).toHaveLength(6)
    for (const want of result.wants ?? []) {
      expect(want.when).toEqual([])
    }

    const plans = result.stylePlans
    expect(plans).toHaveLength(6)

    expect(result.diagnostics ?? []).toHaveLength(0)

    expect(result.stylesheet).toContain('margin: var(--spacing-root);')
    expect(result.stylesheet).toContain('margin: calc(3 * var(--spacing-root));')
    expect(result.stylesheet).toContain('color: red;')
    expect(result.stylesheet).toContain('color: blue;')
    expect(result.stylesheet).toContain('color: green;')
    expect(result.stylesheet).toContain('color: purple;')
  },
}

export default spec

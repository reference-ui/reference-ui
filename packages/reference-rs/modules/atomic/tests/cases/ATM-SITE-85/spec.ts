/**
 * Declared-props shadow station (Forge §14). A host's own declared props
 * are attributes on that host: Button's `size` never reaches the
 * resolver, while Div — which declares no `size` — still folds the
 * macro, and Button's `color` (inherited through StyleProps, not owned)
 * still extracts.
 */
import { expect } from 'vitest'
import { getWantsForProp, hasWant, type AtomicCaseSpec } from '../../helpers.js'

const spec: AtomicCaseSpec = {
  id: 'ATM-SITE-85',
  verify(result) {
    // Button's `size` is the component's variant prop: no want, no warning.
    expect(getWantsForProp(result, 'size')).toHaveLength(1)
    expect(hasWant(result, 'size', '2r')).toBe(true)
    expect(hasWant(result, 'size', 'sm')).toBe(false)

    // Button's `color` is not owned (it arrives via StyleProps): extracts.
    expect(hasWant(result, 'color', 'red')).toBe(true)
    expect(result.wants ?? []).toHaveLength(2)

    // Div's `size` folds the macro at resolve: equal width and height.
    const sheet = result.stylesheet
    expect(sheet).toContain('width: calc(2 * var(--spacing-root));')
    expect(sheet).toContain('height: calc(2 * var(--spacing-root));')
    expect(sheet).toContain('color: red;')
    expect(sheet).not.toContain('width: sm;')
    expect(sheet).not.toContain('height: sm;')

    // The only diagnostic is Button's own honest rest-spread: owned
    // shadowing itself warns nothing, and spreads stay host-blind.
    expect(result.diagnostics).toEqual([
      expect.objectContaining({
        severity: 'warning',
        code: 'ATM-W-UNFOLDABLE-SPREAD',
        message: 'Dynamic object spread encountered in style object; keeping sibling properties',
      }),
    ])
  },
}

export default spec

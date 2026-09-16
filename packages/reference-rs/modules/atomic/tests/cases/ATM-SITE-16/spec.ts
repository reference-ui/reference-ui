/**
 * Cross-file station. A `const` declared in tokens.ts resolves at sites
 * in App.tsx, while styles under node_modules, dist, .reference-ui, and
 * non-source extensions are never compiled.
 */
import { expect } from 'vitest'
import { getWantsForProp, type AtomicCaseSpec } from '../../helpers.js'

const spec: AtomicCaseSpec = {
  id: 'ATM-SITE-16',
  verify(result) {
    const colors = getWantsForProp(result, 'color')
    expect(colors).toHaveLength(2)
    for (const want of colors) {
      expect(want.value).toEqual({ String: 'blue.600' })
    }
    expect(result.stylesheet).toContain('color: var(--colors-blue-600);')
    expect(result.stylesheet).not.toContain('skipped')
    expect(result.diagnostics).toEqual([])
  },
}

export default spec

/**
 * Station specification for ATL-TYPE-01-unsupported-inline.
 * Validates that unsupported inline type annotations are omitted from component
 * inventory and flagged with explicit compiler diagnostics.
 * Proves primary SPEC anchor ATL-TYPE-01.
 */
import { expect } from 'vitest'
import type { AtlasCaseSpec } from '../../helpers.js'

const spec: AtlasCaseSpec = {
  id: 'ATL-TYPE-01',
  verify(result) {
    const names = result.components.map(c => c.name)
    expect(names).not.toContain('InlineBadge')

    expect(result.diagnostics).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: 'unsupported-props-annotation',
          componentName: 'InlineBadge',
        }),
      ])
    )
  },
}

export default spec

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
          code: 'ATL-W-UNSUPPORTED-PROPS-ANNOTATION',
          severity: 'warning',
          file: './components/InlineBadge.tsx',
        }),
      ])
    )
    const found = result.diagnostics.find(
      d => d.code === 'ATL-W-UNSUPPORTED-PROPS-ANNOTATION'
    )
    expect(found?.message).toContain('`InlineBadge`')
  },
}

export default spec

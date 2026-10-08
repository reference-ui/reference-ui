/**
 * Station specification for ATL-PROP-01-unresolved-props.
 * Validates partial component result retention alongside explicit diagnostic
 * emission when referenced TypeScript interfaces cannot be resolved.
 * Proves primary SPEC anchor ATL-PROP-01.
 */
import { expect } from 'vitest'
import type { AtlasCaseSpec } from '../../helpers.js'

const spec: AtlasCaseSpec = {
  id: 'ATL-PROP-01',
  verify(result) {
    const names = result.components.map(c => c.name)
    expect(names).toContain('BrokenCard')

    expect(result.diagnostics).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: 'ATL-W-UNRESOLVED-PROPS-TYPE',
          severity: 'warning',
          file: './components/BrokenCard.tsx',
        }),
      ])
    )
    const found = result.diagnostics.find(d => d.code === 'ATL-W-UNRESOLVED-PROPS-TYPE')
    expect(found?.message).toContain('`BrokenCard`')
    expect(found?.message).toContain('`MissingProps`')
  },
}

export default spec

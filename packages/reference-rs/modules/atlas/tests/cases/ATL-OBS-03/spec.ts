/**
 * Case specification for ATL-OBS-03.
 * Validates the unbound-tag rule: `<Div>` counts in the one file that imports from the observed
 * source and leaves the name undeclared, and does not count when it is imported from another
 * module, defined as a local function, declared by destructuring, or used without any import.
 * Proves ATL-OBS-03 (src/usage/observe.rs, src/usage/scope.rs).
 */
import { expect } from 'vitest'
import type { AtlasCaseSpec } from '../../harness/helpers.js'

const spec: AtlasCaseSpec = {
  id: 'ATL-OBS-03',
  verify(result) {
    expect(result.observed.map(element => element.name)).toEqual(['Div'])

    const div = result.observed[0]!
    expect(div.source).toBe('@reference-ui/react')
    expect(div.count).toBe(1)
    expect(div.filePresence).toBe(1)
    expect(div.examples).toEqual(['<Div className={panel}>'])
  },
}

export default spec

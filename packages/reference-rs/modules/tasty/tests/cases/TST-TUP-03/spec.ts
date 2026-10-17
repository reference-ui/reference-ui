/**
 * Case specification for TST-TUP-03.
 * A labeled rest tuple element keeps its label, rest flag, and array element type, matching the
 * unnamed `...T[]` control. Proves the named-rest lowering in the tuple element path.
 */
import { expect } from 'vitest'
import type { StationSpec } from '../../../../../testing/index.js'
import type { TastyCaseResult } from '../../harness/helpers.js'

interface TupleElementJson {
  label?: string
  optional: boolean
  rest: boolean
  element: { kind?: string }
}

const spec: StationSpec<TastyCaseResult> = {
  id: 'TST-TUP-03',
  async verify({ api }) {
    const elementsOf = async (name: string): Promise<TupleElementJson[]> => {
      const sym = await api.loadSymbolByName(name)
      return (sym.getUnderlyingType()?.getRaw() as { elements: TupleElementJson[] }).elements
    }

    const unnamed = await elementsOf('UnnamedRest')
    const named = await elementsOf('NamedRest')

    expect(unnamed[1]?.rest).toBe(true)
    expect(named.map(element => element.label)).toEqual(['a', 'b', 'rest'])
    expect(named[1]?.optional).toBe(true)
    expect(named[2]?.rest).toBe(true)
    expect(named[2]?.element.kind).toBe('array')
  },
}

export default spec

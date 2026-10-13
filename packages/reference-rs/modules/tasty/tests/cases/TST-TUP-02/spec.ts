/**
 * Station specification for TST-TUP-02.
 * Indexing a rest tuple yields the rest element's item type, for a literal index and for `number`.
 * An optional element stays unresolved, because its type would gain `undefined` under strictNullChecks.
 */
import { expect } from 'vitest'
import type { StationSpec } from '../../../../../testing/index.js'
import type { TastyCaseResult } from '../../harness/helpers.js'

type Json = {
  kind?: string
  name?: string
  value?: string
  types?: Json[]
}

/** Stable text for an emitted TypeRef, or `unresolved` when the field is absent. */
function show(t: Json | null | undefined): string {
  if (t === undefined || t === null) return 'unresolved'
  if (t.kind === 'literal') return t.value ?? ''
  if (t.kind === 'intrinsic') return t.name ?? ''
  if (t.kind === 'union') return (t.types ?? []).map(show).sort().join(' | ')
  return JSON.stringify(t)
}

const spec: StationSpec<TastyCaseResult> = {
  id: 'TST-TUP-02',
  async verify({ api }) {
    const problems: string[] = []
    const cases: Array<[string, string]> = [
      ['SecondOfRest', 'number'],
      ['HeadOfRest', 'string'],
      ['ElementOfRest', 'number | string'],
      ['TailOfNamed', 'boolean'],
      ['OptionalSecond', 'unresolved'],
    ]
    for (const [name, want] of cases) {
      const sym = await api.loadSymbolByName(name)
      const raw = sym.getUnderlyingType()?.getRaw() as
        | { kind?: string; resolved?: Json | null }
        | undefined
      const actual = show(raw?.resolved)
      if (actual !== want) {
        problems.push(`${name}.resolved: expected ${JSON.stringify(want)} got ${JSON.stringify(actual)}`)
      }
    }
    expect(problems).toEqual([])
  },
}

export default spec

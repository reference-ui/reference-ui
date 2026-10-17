/**
 * Case specification for TST-CND-02.
 * A conditional on a bare type parameter stays deferred, a union reached through an alias is never
 * distributed, and a naked type parameter instantiated with that union distributes over its members.
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
  id: 'TST-CND-02',
  async verify({ api }) {
    const problems: string[] = []
    const cases: Array<[string, string]> = [
      ['IsString', 'unresolved'],
      ['NotDistributed', '2'],
      ['Distributed', '1 | 2'],
    ]
    for (const [name, want] of cases) {
      const sym = await api.loadSymbolByName(name)
      const raw = sym.getUnderlyingType()?.getRaw() as
        | { kind?: string; resolved?: Json | null }
        | undefined
      if (raw?.kind !== 'conditional') {
        problems.push(`${name}.kind: expected "conditional" got ${JSON.stringify(raw?.kind)}`)
      }
      const actual = show(raw?.resolved)
      if (actual !== want) {
        problems.push(`${name}.resolved: expected ${JSON.stringify(want)} got ${JSON.stringify(actual)}`)
      }
    }
    expect(problems).toEqual([])
  },
}

export default spec

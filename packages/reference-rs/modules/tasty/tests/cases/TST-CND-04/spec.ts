/**
 * Station specification for TST-CND-04.
 * Reaching verify means the native scan returned: a stack overflow would kill the worker first. Every
 * recursive alias here must end unresolved, the growing template literal must settle to 'done', and the
 * template literal union at nine parts must expand while the eleven-part one fails closed.
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
  id: 'TST-CND-04',
  async verify({ api }) {
    const problems: string[] = []
    for (const name of ['Nest', 'Repeat', 'Chain', 'Grow', 'Grow2']) {
      await api.loadSymbolByName(name)
    }

    const cases: Array<[string, string]> = [
      ['StartChain', 'unresolved'],
      ['StartGrow', "'done'"],
      ['Grow2', 'unresolved'],
      ['Wide11', 'unresolved'],
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

    const wide = (await api.loadSymbolByName('Wide9')).getUnderlyingType()?.getRaw() as
      | { resolved?: Json | null }
      | undefined
    const wideResolved = wide?.resolved
    const members = wideResolved?.kind === 'union' ? wideResolved.types?.length : undefined
    if (members !== 512) {
      problems.push(`Wide9.resolved: expected a 512-member union got ${JSON.stringify(members ?? null)}`)
    }

    expect(problems).toEqual([])
  },
}

export default spec

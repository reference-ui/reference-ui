// Unit tests for the published-system assembly root.
// They take narrow assembly inputs and assert the mapped BaseSystem shape.
// The round-trip leg pins the extends chain's founding invariant: assembly
// output always satisfies the entries validator.

import { describe, expect, it } from 'vitest'
import { assembleBaseSystem } from './assemble.ts'
import type { SystemStreams } from './types.ts'
import { validateBaseSystemEntries } from './validate.ts'

const STREAMS: SystemStreams[] = [
  {
    name: 'app-system',
    preamble: '@layer reset, global, base, tokens, recipes, utilities;\n',
    tokensPortable: '@layer tokens {\n}\n',
    package: 'app-system',
  },
]

describe('assembleBaseSystem', () => {
  it('maps the narrow input onto the published shape', () => {
    expect(
      assembleBaseSystem({
        name: 'app-system',
        fragment: ';tokens()',
        streams: STREAMS,
        jsxElements: ['Card', 'Panel'],
      })
    ).toEqual({
      name: 'app-system',
      fragment: ';tokens()',
      streams: STREAMS,
      jsxElements: ['Card', 'Panel'],
    })
  })

  it('leaves streams undefined when the input carries none', () => {
    const assembled = assembleBaseSystem({
      name: 'app-system',
      fragment: ';tokens()',
      jsxElements: [],
    })

    expect(assembled.streams).toBeUndefined()
    expect(assembled.name).toBe('app-system')
  })

  it('passes the extends entries validator', () => {
    const assembled = assembleBaseSystem({
      name: 'app-system',
      fragment: ';tokens()',
      streams: STREAMS,
      jsxElements: ['Card'],
    })

    expect(() =>
      validateBaseSystemEntries('extends', [assembled], { requireFragment: true })
    ).not.toThrow()
  })
})

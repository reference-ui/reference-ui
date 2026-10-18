// Unit tests for the published-system assembly root.
// They take narrow assembly inputs and assert the mapped BaseSystem shape.
// The owned prop map rides only when it names a prop, so a system without
// one prints the keys it always did. The round-trip leg pins the extends
// chain's founding invariant: assembly output always satisfies the entries
// validator.

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

  it('carries the owned prop map beside jsxElements when it names a prop', () => {
    const assembled = assembleBaseSystem({
      name: 'app-system',
      fragment: ';tokens()',
      streams: STREAMS,
      jsxElements: ['Tile'],
      jsxOwned: { Tile: ['size'] },
    })

    expect(assembled.jsxOwned).toEqual({ Tile: ['size'] })
    expect(Object.keys(assembled).filter((key) => key.startsWith('jsx'))).toEqual(['jsxElements', 'jsxOwned'])
  })

  it('leaves jsxOwned out for an absent or empty owned map', () => {
    const base = { name: 'app-system', fragment: ';tokens()', jsxElements: ['Card'] }

    for (const jsxOwned of [undefined, {}]) {
      const assembled = assembleBaseSystem({ ...base, jsxOwned })
      expect(JSON.stringify(assembled)).toBe(JSON.stringify(assembleBaseSystem(base)))
      expect(JSON.stringify(assembled)).not.toContain('jsxOwned')
    }
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

  it('passes the extends entries validator with owned props, and keeps them through a JSON round trip', () => {
    const assembled = assembleBaseSystem({
      name: 'app-system',
      fragment: ';tokens()',
      streams: STREAMS,
      jsxElements: ['Tile'],
      jsxOwned: { Tile: ['size'] },
    })
    const reread = JSON.parse(JSON.stringify(assembled)) as typeof assembled

    expect(() =>
      validateBaseSystemEntries('extends', [reread], { requireFragment: true })
    ).not.toThrow()
    expect(reread.jsxOwned).toEqual({ Tile: ['size'] })
  })
})

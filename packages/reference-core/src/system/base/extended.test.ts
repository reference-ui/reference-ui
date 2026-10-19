// Unit tests for the extends closure as system names. They take fragment node lists and composed system
// names shaped like real syncs (a chain, a layered upstream, an extendSystem override node, a legacy
// system) and assert which names come back and in what order.

import { describe, expect, it } from 'vitest'
import { extendedSystemNames, extendedSystemsOf } from './extended.ts'
import type { BaseSystem, FragmentNode } from './types.ts'

function nodes(...names: string[]): FragmentNode[] {
  return names.map((name) => ({ name, bundle: '' }))
}

describe('extendedSystemNames', () => {
  it('keeps every composed system a fragment node names, in system order', () => {
    expect(extendedSystemNames(nodes('mid', 'base'), ['base', 'mid'], 'app')).toEqual(['base', 'mid'])
  })

  it('leaves out a layered system, which publishes streams but no fragment node', () => {
    expect(extendedSystemNames(nodes('acme'), ['acme', 'icons'], 'app')).toEqual(['acme'])
  })

  it('leaves out the system itself, an override node, and repeats', () => {
    const list = nodes('acme', 'extend:acme', 'app')
    expect(extendedSystemNames(list, ['acme', 'acme', 'app'], 'app')).toEqual(['acme'])
  })

  it('is empty with nothing extended', () => {
    expect(extendedSystemNames([], ['icons'], 'app')).toEqual([])
  })
})

describe('extendedSystemsOf', () => {
  it('reads a published system: its fragments against its streams, itself left out', () => {
    const published: BaseSystem = {
      name: 'b',
      fragment: '',
      fragments: nodes('a', 'b'),
      streams: [
        { name: 'icons', preamble: '' },
        { name: 'a', preamble: '' },
        { name: 'b', preamble: '' },
      ],
    }
    expect(extendedSystemsOf(published)).toEqual(['a'])
  })

  it('is empty for a legacy system with no fragment nodes or streams', () => {
    expect(extendedSystemsOf({ name: 'old', fragment: ';tokens({})' })).toEqual([])
  })
})

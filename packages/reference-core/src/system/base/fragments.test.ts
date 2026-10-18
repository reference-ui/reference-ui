// Unit tests for the portable fragment bundle assembly and the named fragment nodes.
// They take upstream and local bundle lists and assert the concatenated fragment
// order, then take published node lists and assert linearization: upstream first,
// each name at its first occurrence, and a legacy entry read as one opaque node.

import { describe, expect, it } from 'vitest'
import {
  createPortableFragmentBundle,
  fragmentNodesOf,
  linearizeFragmentNodes,
  portableFragmentOf,
  publishedFragmentNodes,
} from './fragments.ts'

describe('createPortableFragmentBundle', () => {
  it('creates a portable fragment bundle in stable upstream-then-local order', () => {
    expect(
      createPortableFragmentBundle(
        ['upstreamOne()', 'upstreamTwo()'],
        ['localOne()', 'localTwo()']
      )
    ).toBe(';upstreamOne()\n;upstreamTwo()\n;localOne()\n;localTwo()')
  })

  it('preserves declared upstream order ahead of local bundles', () => {
    expect(
      createPortableFragmentBundle(
        ['zebra()', 'apple()', 'mango()'],
        ['localOne()', 'localTwo()']
      )
    ).toBe(';zebra()\n;apple()\n;mango()\n;localOne()\n;localTwo()')
  })

  it('emits locals only when no upstream bundles exist', () => {
    expect(createPortableFragmentBundle([], ['localOne()'])).toBe(';localOne()')
  })

  it('emits nothing when both lists are empty', () => {
    expect(createPortableFragmentBundle([], [])).toBe('')
  })
})

describe('fragmentNodesOf', () => {
  it('reads a legacy entry as one opaque node named after its system (E15)', () => {
    expect(fragmentNodesOf({ name: 'legacy', fragment: 'tokens()' })).toEqual([
      { name: 'legacy', bundle: 'tokens()' },
    ])
  })

  it('reads the published node list when the entry carries one', () => {
    expect(
      fragmentNodesOf({
        name: 'branch',
        fragment: ';base()\n;branch()',
        fragments: [
          { name: 'base', bundle: 'base()' },
          { name: 'branch', bundle: 'branch()' },
        ],
      })
    ).toEqual([
      { name: 'base', bundle: 'base()' },
      { name: 'branch', bundle: 'branch()' },
    ])
  })

  it('reads nothing from a blank legacy fragment', () => {
    expect(fragmentNodesOf({ name: 'blank', fragment: '   ' })).toEqual([])
  })
})

describe('linearizeFragmentNodes', () => {
  it('concatenates in declared order and keeps each name at its first occurrence (E1, E2)', () => {
    const base = [{ name: 'a', bundle: 'a()' }]
    const branchB = [
      { name: 'a', bundle: 'a()' },
      { name: 'b', bundle: 'b()' },
    ]
    const branchC = [
      { name: 'a', bundle: 'a()' },
      { name: 'c', bundle: 'c()' },
    ]

    expect(linearizeFragmentNodes([branchB, branchC]).map((node) => node.name)).toEqual(['a', 'b', 'c'])
    expect(linearizeFragmentNodes([branchC, branchB]).map((node) => node.name)).toEqual(['a', 'c', 'b'])
    expect(linearizeFragmentNodes([base, base])).toEqual([{ name: 'a', bundle: 'a()' }])
  })
})

describe('publishedFragmentNodes', () => {
  it('lists upstream nodes first and the own node last', () => {
    expect(
      publishedFragmentNodes([{ name: 'base', bundle: 'base()' }], 'branch', ['localOne()', 'localTwo()'])
    ).toEqual([
      { name: 'base', bundle: 'base()' },
      { name: 'branch', bundle: ';localOne()\n;localTwo()' },
    ])
  })

  it('keeps the own node last even when it carries no local bundles', () => {
    expect(publishedFragmentNodes([], 'lonely', [])).toEqual([{ name: 'lonely', bundle: '' }])
  })
})

describe('portableFragmentOf', () => {
  it('concatenates the node bundles into the legacy fragment string', () => {
    expect(
      portableFragmentOf([
        { name: 'base', bundle: 'base()' },
        { name: 'branch', bundle: 'branch()' },
      ])
    ).toBe(';base()\n;branch()')
  })
})

// Unit tests for the portable fragment bundle assembly.
// They take upstream and local bundle lists and assert the concatenated
// fragment order. Upstream bundles always lead in declared order; every
// bundle rides its own semicolon-prefixed line.

import { describe, expect, it } from 'vitest'
import { createPortableFragmentBundle } from './fragments.ts'

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

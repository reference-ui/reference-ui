import { describe, expect, it } from 'vitest'

import { traceCase } from './helpers'

describe('styletrace', () => {
  it('finds direct primitive wrappers with public style props', async () => {
    await expect(traceCase('direct_wrapper')).resolves.toEqual(['Card'])
  })

  it('propagates style-bearing links through wrapper chains', async () => {
    await expect(traceCase('wrapper_chain')).resolves.toEqual(['Card', 'Surface'])
  })

  it('returns exported alias names for traced wrappers', async () => {
    await expect(traceCase('reexport_alias')).resolves.toEqual(['Panel'])
  })

  it('ignores components that render primitives without exposing style props', async () => {
    await expect(traceCase('negative')).resolves.toEqual([])
  })
})
// Unit tests for the runtime family-scope pass, ported from the Rust
// `resolve/font/scope.rs` cases. They build NamerRequest queries directly and
// assert which bare keyword weights the pass rewrites, so the six-keyword gate
// and same-`when`/base fallback are observable without registering tables. The
// static-only global-block case has no runtime analog (F9) and is not ported.

import { describe, expect, it } from 'vitest'
import type { NamerRequest } from '@reference-ui/rust/namer'
import { applyFamilyScope, isFamilyKey, scopeWeightName } from './scope.ts'

function request(prop: string, value: unknown, when: string[] = []): NamerRequest {
  return { when, prop, value, important: false }
}

function weightOf(queries: NamerRequest[]): unknown {
  return queries.find(query => query.prop === 'weight')?.value
}

describe('applyFamilyScope', () => {
  it('scopes a bare weight to its sibling font', () => {
    const queries = [request('font', 'sans'), request('weight', 'thin')]
    applyFamilyScope(queries)
    expect(weightOf(queries)).toBe('sans.thin')
  })

  it('leaves a bare weight without a family untouched', () => {
    const queries = [request('weight', 'bold')]
    applyFamilyScope(queries)
    expect(weightOf(queries)).toBe('bold')
  })

  it('passes scoped, numeric, and unknown weights through', () => {
    const queries = [
      request('font', 'sans'),
      request('weight', 'sans.bold'),
      request('weight', 393),
      request('weight', 'extra-bold'),
    ]
    applyFamilyScope(queries)
    const weights = queries.filter(query => query.prop === 'weight').map(query => query.value)
    expect(weights).toEqual(['sans.bold', 393, 'extra-bold'])
  })

  it('declines to guess between conflicting families', () => {
    const queries = [request('font', 'sans'), request('font', 'mono'), request('weight', 'thin')]
    applyFamilyScope(queries)
    expect(weightOf(queries)).toBe('thin')
  })

  it('seeds from fontFamily but never from a stack', () => {
    const seeded = [request('fontFamily', 'serif'), request('weight', 'normal')]
    applyFamilyScope(seeded)
    expect(weightOf(seeded)).toBe('serif.normal')

    const stacked = [
      request('fontFamily', '"Inter", sans-serif'),
      request('weight', 'thin'),
    ]
    applyFamilyScope(stacked)
    expect(weightOf(stacked)).toBe('thin')
  })

  it('falls a nested weight back to the base font', () => {
    const queries = [request('font', 'sans'), request('weight', 'thin', ['_hover'])]
    applyFamilyScope(queries)
    expect(weightOf(queries)).toBe('sans.thin')
  })

  it('lets a same-group font beat the base font', () => {
    const queries = [
      request('font', 'sans'),
      request('font', 'mono', ['_hover']),
      request('weight', 'thin', ['_hover']),
    ]
    applyFamilyScope(queries)
    expect(weightOf(queries)).toBe('mono.thin')
  })

  it('skips object-valued (responsive) weights', () => {
    const queries = [
      request('font', 'sans'),
      request('weight', { base: 'thin', md: 'bold' }),
    ]
    applyFamilyScope(queries)
    expect(weightOf(queries)).toEqual({ base: 'thin', md: 'bold' })
  })
})

describe('scopeWeightName', () => {
  it('guards its inputs', () => {
    expect(scopeWeightName('thin', 'sans')).toBe('sans.thin')
    expect(scopeWeightName('sans.thin', 'sans')).toBeUndefined()
    expect(scopeWeightName('thin', '"Inter", sans-serif')).toBeUndefined()
    expect(scopeWeightName('thin', '')).toBeUndefined()
    expect(scopeWeightName('393', 'sans')).toBeUndefined()
  })

  it('recognises family keys and rejects stacks', () => {
    expect(isFamilyKey('sans')).toBe(true)
    expect(isFamilyKey('my-family_2')).toBe(true)
    expect(isFamilyKey('')).toBe(false)
    expect(isFamilyKey('a b')).toBe(false)
  })
})

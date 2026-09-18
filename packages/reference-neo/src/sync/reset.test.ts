// Unit tests for the controlled reset injection over synthetic specs.
// They take the flag states and assert fragment prepend plus rule content.
// The engine routing itself is proven by station ATM-LAYER-08, not here.

import { describe, expect, it } from 'vitest'
import type { EvaluatedSystemSpec } from '@reference-ui/rust/contracts'
import {
  RESET_FRAGMENT_SOURCE,
  applyNormalizeCss,
  createResetRules,
  shouldInjectReset,
} from './reset.ts'

function emptySpec(): EvaluatedSystemSpec {
  return {
    schemaVersion: 1,
    profile: 'reference-ui',
    name: 'test',
    tokens: {},
    fonts: {},
    globalCss: [],
    keyframes: {},
    recipes: {},
    staticCss: {},
    provenance: [],
  }
}

describe('shouldInjectReset', () => {
  it('injects by default and on true, omits only on false', () => {
    expect(shouldInjectReset(undefined)).toBe(true)
    expect(shouldInjectReset(true)).toBe(true)
    expect(shouldInjectReset(false)).toBe(false)
  })
})

describe('createResetRules', () => {
  it('covers the Andy Bell rules with walker-safe spellings', () => {
    const rules = createResetRules()

    expect(rules['*, *::before, *::after']).toMatchObject({ boxSizing: 'border-box' })
    expect(rules['body, h1, h2, h3, h4, p, figure, blockquote, dl, dd']).toEqual({ margin: 0 })
    expect(rules["ul[role='list'], ol[role='list']"]).toEqual({ listStyle: 'none' })
    expect(rules['html:focus-within']).toMatchObject({ scrollBehavior: 'smooth' })
    expect(rules['body']).toMatchObject({ minHeight: '100vh' })
    expect(rules['body']).not.toHaveProperty('containerType')
    expect(rules['a:not([class])']).toEqual({ textDecorationSkipInk: 'auto' })
    expect(rules['img, picture']).toEqual({ display: 'block', maxWidth: '100%' })
    expect(rules['input, button, textarea, select']).toMatchObject({
      fontFamily: 'inherit',
      fontSize: 'inherit',
      fontWeight: 'inherit',
    })
  })

  it('nests reduced-motion per selector since top-level at-rules do not exist', () => {
    const rules = createResetRules()
    const universal = rules['*, *::before, *::after'] as Record<string, unknown>

    expect(universal['@media (prefers-reduced-motion: reduce)']).toMatchObject({
      animationDuration: '0.01ms !important',
      transitionDuration: '0.01ms !important',
    })
    expect(rules['@media (prefers-reduced-motion: reduce)']).toBeUndefined()
  })

  it('returns a fresh tree on every call', () => {
    const first = createResetRules()
    const second = createResetRules()

    expect(first).toEqual(second)
    expect(first).not.toBe(second)
    expect(first['body']).not.toBe(second['body'])
  })
})

describe('applyNormalizeCss', () => {
  it('prepends the reset fragment and provenance ahead of author fragments', () => {
    const spec = emptySpec()
    spec.globalCss.push({ source: 'theme/a.ts', rules: { '.app': { color: 'red' } } })
    spec.provenance.push({ source: 'theme/a.ts', kind: 'globalCss' })

    applyNormalizeCss(spec, undefined)

    expect(spec.globalCss).toHaveLength(2)
    expect(spec.globalCss[0]?.source).toBe(RESET_FRAGMENT_SOURCE)
    expect(spec.globalCss[1]?.source).toBe('theme/a.ts')
    expect(spec.provenance).toHaveLength(2)
    expect(spec.provenance[0]).toEqual({ source: RESET_FRAGMENT_SOURCE, kind: 'globalCss' })
  })

  it('leaves the spec untouched when the flag is false', () => {
    const spec = emptySpec()

    applyNormalizeCss(spec, false)

    expect(spec.globalCss).toEqual([])
    expect(spec.provenance).toEqual([])
  })
})

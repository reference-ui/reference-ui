// Unit tests for how extendSystem reads a leaf's value, light and dark slots. The rule is the compiler's
// `pair_from_slots` (reference-rs base-system lower/mod.rs, test bas_token_04_resolves_mode_slots):
// `value` fills the mode the leaf does not name, and a one-slot leaf is its light value with no dark.
// Slots are strings only, so a numeric slot throws here instead of failing sync later.
// The base declares `brand.soft` with no dark value, so only a leaf's own dark value reaches the dark rule.

import { describe, expect, it } from 'vitest'
import { ExtendSystemError, extendSystem } from './extend.ts'
import type { BaseSystem } from './types.ts'

const NAME = 'modes-base'
const LIGHT = `[data-layer="${NAME}"], [data-layer="${NAME}"][data-color-mode=light]`
const DARK = `[data-layer="${NAME}"][data-color-mode=dark]`

const OWN_TOKENS = [
  '@layer tokens {',
  `  ${LIGHT} {`,
  '    --colors-brand-soft: #e5e7eb;',
  '    --colors-brand-accent: #0d9488;',
  '  }',
  `  ${DARK} {`,
  '    --colors-brand-accent: #5eead4;',
  '  }',
  '}',
  '',
].join('\n')

const BASE: BaseSystem = {
  name: NAME,
  fragment: ';globalThis.modes = 1',
  fragments: [{ name: NAME, bundle: ';tokens({})' }],
  streams: [{ name: NAME, preamble: '@layer reset, tokens;\n', tokensPortable: OWN_TOKENS, utilities: '' }],
}

function declsUnder(css: string, selector: string): Record<string, string> {
  const lines = css.split('\n')
  const start = lines.indexOf(`  ${selector} {`)
  const decls: Record<string, string> = {}
  if (start < 0) return decls
  for (const line of lines.slice(start + 1)) {
    if (line === '  }') break
    const match = /^ {4}(--[^:]+): (.*);$/.exec(line)
    if (match) decls[match[1]] = match[2]
  }
  return decls
}

// The accent leaf forces a dark rule, so a missing soft entry there means extendSystem chose to print none.
function modesOf(leaf: Record<string, string>): { light?: string; dark?: string } {
  const next = extendSystem(BASE, {
    tokens: { colors: { brand: { soft: leaf, accent: { value: '#000000', dark: '#ffffff' } } } },
  })
  const appended = (next.streams?.[0]?.tokensPortable ?? '').slice(OWN_TOKENS.length)
  return {
    light: declsUnder(appended, LIGHT)['--colors-brand-soft'],
    dark: declsUnder(appended, DARK)['--colors-brand-soft'],
  }
}

describe('extendSystem: mode slots', () => {
  it('sends light to light and dark to dark for a light and dark leaf', () => {
    expect(modesOf({ light: '#111111', dark: '#222222' })).toEqual({ light: '#111111', dark: '#222222' })
  })

  it('gives value to dark when the leaf names light', () => {
    expect(modesOf({ value: '#333333', light: '#111111' })).toEqual({ light: '#111111', dark: '#333333' })
  })

  it('gives value to light when the leaf names dark', () => {
    expect(modesOf({ value: '#333333', dark: '#222222' })).toEqual({ light: '#333333', dark: '#222222' })
  })

  it('prints a value-only leaf as light with no dark entry', () => {
    expect(modesOf({ value: '#333333' })).toEqual({ light: '#333333', dark: undefined })
  })

  it('prints a light-only leaf as light with no dark entry', () => {
    expect(modesOf({ light: '#111111' })).toEqual({ light: '#111111', dark: undefined })
  })

  it('sends light to light and dark to dark when all three slots are set', () => {
    expect(modesOf({ value: '#333333', light: '#111111', dark: '#222222' })).toEqual({
      light: '#111111',
      dark: '#222222',
    })
  })

  it('rejects a numeric slot, as the compiler does', () => {
    const leaf = { value: 4 } as never
    const call = () => extendSystem(BASE, { tokens: { colors: { brand: { soft: leaf } } } })
    expect(call).toThrow(ExtendSystemError)
    expect(call).toThrow('token colors.brand.soft must be a string')
  })

  it('prints a dark-only leaf as light with no dark entry', () => {
    expect(modesOf({ dark: '#222222' })).toEqual({ light: '#222222', dark: undefined })
  })
})

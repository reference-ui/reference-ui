// Unit tests for extendSystem. They take a base system in the engine's Portable token
// format and assert the one override block it appends: the selectors, the light and dark rules, the
// untouched entries, chained merges, references, the named misuse, and the extends fragment node.
// The duplicate and self-name rules run through validateConfig, so they read the real config path.

import { describe, expect, it } from 'vitest'
import { validateConfig } from '../../config/validate.ts'
import { ExtendSystemError, extendFragmentNode, extendSystem } from './extend.ts'
import { fragmentNodesOf } from './fragments.ts'
import type { BaseSystem } from './types.ts'

const NAME = 'reference-ui'
const ICONS = 'reference-icons'
const DEFAULT_INCLUDE = ['src/**/*.{ts,tsx}']
// The engine's Portable selectors, spelled out from atomic/src/stylesheet/system_layers/scope.rs. BASE
// extends icons (its fragments carry the icons node), so its own token block claims the icons stamps
// after its own; a base that only layers icons claims its own stamps alone.
const OWN_LIGHT = '[data-layer="reference-ui"], [data-layer="reference-ui"][data-color-mode=light]'
const OWN_DARK = '[data-layer="reference-ui"][data-color-mode=dark]'
const PORTABLE_LIGHT = `${OWN_LIGHT}, [data-layer="reference-icons"], [data-layer="reference-icons"][data-color-mode=light]`
const PORTABLE_DARK = `${OWN_DARK}, [data-layer="reference-icons"][data-color-mode=dark]`

// The own entry's tokens as the engine prints them under one stamp list: a light rule, then a dark rule.
// `brand.soft` has no dark value, so the base prints no dark rule for it; `brand.ink` and `brand.accent` do.
function ownTokensUnder(light: string, dark: string): string {
  return [
    '@layer tokens {',
    `  ${light} {`,
    '    --colors-brand-ink: #1f2937;',
    '    --colors-brand-soft: #e5e7eb;',
    '    --colors-brand-accent: #0d9488;',
    '    --colors-gray-900: #111827;',
    '    --colors-text-primary: var(--colors-gray-900);',
    '  }',
    `  ${dark} {`,
    '    --colors-brand-ink: #e5e7eb;',
    '    --colors-brand-accent: #5eead4;',
    '  }',
    '}',
    '',
  ].join('\n')
}

const OWN_TOKENS = ownTokensUnder(PORTABLE_LIGHT, PORTABLE_DARK)

const ICON_TOKENS = [
  '@layer tokens {',
  `  [data-layer="${ICONS}"], [data-layer="${ICONS}"][data-color-mode=light] {`,
  '    --colors-icon-ink: #000000;',
  '  }',
  '}',
  '',
].join('\n')

const BASE: BaseSystem = {
  name: NAME,
  fragment: ';globalThis.reference = 1',
  fragments: [
    { name: ICONS, bundle: ';globalThis.icons = 1' },
    { name: NAME, bundle: ';tokens({ colors: { brand: { ink: { value: "#1f2937" } } } })' },
  ],
  streams: [
    { name: ICONS, preamble: '@layer reset;\n', tokensPortable: ICON_TOKENS },
    { name: NAME, preamble: '@layer reset, tokens;\n', tokensPortable: OWN_TOKENS, utilities: '' },
  ],
  jsxElements: ['Button'],
  jsxOwned: { Button: ['size'] },
}

function ownTokens(system: BaseSystem): string {
  return system.streams?.find((stream) => stream.name === NAME)?.tokensPortable ?? ''
}

// The text one call appended after the base's own tokens.
function appendedOf(system: BaseSystem): string {
  return ownTokens(system).slice(OWN_TOKENS.length)
}

// The declarations under one selector line of a block, as name to value.
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

// Every selector line of a block, in order.
function selectorLines(css: string): string[] {
  return css.split('\n').filter((line) => /^ {2}\S.*\{$/.test(line))
}

describe('extendSystem: the override block', () => {
  it('appends one block whose selectors are the engine Portable selectors', () => {
    const next = extendSystem(BASE, {
      tokens: { colors: { brand: { ink: { value: '#0f766e', dark: '#5eead4' } } } },
    })

    const appended = appendedOf(next)
    expect(appended.startsWith('@layer tokens {\n')).toBe(true)
    expect(selectorLines(appended)).toEqual([`  ${PORTABLE_LIGHT} {`, `  ${PORTABLE_DARK} {`])
    expect(selectorLines(appended)).toEqual(selectorLines(OWN_TOKENS))
  })

  it('prints the exact block for a light and dark leaf', () => {
    const next = extendSystem(BASE, {
      tokens: { colors: { brand: { ink: { value: '#0f766e', dark: '#5eead4' } } } },
    })

    expect(appendedOf(next)).toBe(
      [
        '@layer tokens {',
        `  ${PORTABLE_LIGHT} {`,
        '    --colors-brand-ink: #0f766e;',
        '  }',
        `  ${PORTABLE_DARK} {`,
        '    --colors-brand-ink: #5eead4;',
        '  }',
        '}',
        '',
      ].join('\n')
    )
  })

  it('sends a dark leaf to the dark rule and keeps its light value in the light rule', () => {
    const next = extendSystem(BASE, {
      tokens: { colors: { brand: { accent: { value: '#0f766e', dark: '#99f6e4' } } } },
    })

    expect(declsUnder(appendedOf(next), PORTABLE_LIGHT)).toEqual({ '--colors-brand-accent': '#0f766e' })
    expect(declsUnder(appendedOf(next), PORTABLE_DARK)).toEqual({ '--colors-brand-accent': '#99f6e4' })
  })

  it('replaces a base dark value with a light-only leaf in the dark rule', () => {
    const next = extendSystem(BASE, { tokens: { colors: { brand: { ink: { value: '#ff0000' } } } } })

    expect(declsUnder(appendedOf(next), PORTABLE_LIGHT)).toEqual({ '--colors-brand-ink': '#ff0000' })
    expect(declsUnder(appendedOf(next), PORTABLE_DARK)).toEqual({ '--colors-brand-ink': '#ff0000' })
  })

  it('prints no dark rule for a light-only leaf over a base token that has no dark value', () => {
    const next = extendSystem(BASE, { tokens: { colors: { brand: { soft: { value: '#ffffff' } } } } })

    expect(declsUnder(appendedOf(next), PORTABLE_LIGHT)).toEqual({ '--colors-brand-soft': '#ffffff' })
    expect(appendedOf(next)).not.toContain(PORTABLE_DARK)
  })

  it('lowers a {token} reference to var() of the declared custom property', () => {
    const next = extendSystem(BASE, { tokens: { colors: { brand: { soft: { value: '{colors.gray.900}' } } } } })

    expect(declsUnder(appendedOf(next), PORTABLE_LIGHT)).toEqual({
      '--colors-brand-soft': 'var(--colors-gray-900)',
    })
  })

})

describe('extendSystem: the claimed stamps', () => {
  // The same base had it layered icons: icons still ships a stream entry, but no fragment node.
  const LAYERED: BaseSystem = {
    ...BASE,
    fragments: BASE.fragments?.filter((node) => node.name === NAME),
    streams: [
      { name: ICONS, preamble: '@layer reset;\n', tokensPortable: ICON_TOKENS },
      { name: NAME, preamble: '@layer reset, tokens;\n', tokensPortable: ownTokensUnder(OWN_LIGHT, OWN_DARK) },
    ],
  }

  it('claims only its own stamps when the base layers its upstream', () => {
    const next = extendSystem(LAYERED, { tokens: { colors: { brand: { ink: { value: '#0f766e', dark: '#5eead4' } } } } })
    const appended = (next.streams?.[1]?.tokensPortable ?? '').slice(ownTokensUnder(OWN_LIGHT, OWN_DARK).length)

    expect(selectorLines(appended)).toEqual([`  ${OWN_LIGHT} {`, `  ${OWN_DARK} {`])
  })

  it('still finds the dark rule of a base published before it claimed extended stamps', () => {
    const legacy: BaseSystem = {
      ...BASE,
      streams: [BASE.streams?.[0] ?? { name: ICONS, preamble: '' }, { ...LAYERED.streams?.[1], name: NAME, preamble: '' }],
    }
    const next = extendSystem(legacy, { tokens: { colors: { brand: { ink: { value: '#ff0000' } } } } })
    const appended = (next.streams?.[1]?.tokensPortable ?? '').slice(ownTokensUnder(OWN_LIGHT, OWN_DARK).length)

    expect(declsUnder(appended, PORTABLE_DARK)).toEqual({ '--colors-brand-ink': '#ff0000' })
  })
})

describe('extendSystem: the untouched entries', () => {
  it('leaves every other stream entry and the fragments byte-identical', () => {
    const next = extendSystem(BASE, { tokens: { colors: { brand: { ink: { value: '#0f766e' } } } } })

    expect(next.streams?.[0]).toBe(BASE.streams?.[0])
    expect(next.fragments).toEqual(BASE.fragments)
    expect(next.fragment).toBe(BASE.fragment)
    expect(next.jsxElements).toEqual(BASE.jsxElements)
    expect(next.jsxOwned).toEqual(BASE.jsxOwned)
    expect(next.name).toBe(NAME)
    expect({ ...next.streams?.[1], tokensPortable: undefined }).toEqual({
      ...BASE.streams?.[1],
      tokensPortable: undefined,
    })
  })

  it('keeps the extended marker out of the published shape', () => {
    const next = extendSystem(BASE, { tokens: { colors: { brand: { ink: { value: '#0f766e' } } } } })

    expect(Object.keys(next)).not.toContain('extended')
    expect(JSON.stringify(next)).not.toContain('extended')
  })
})

describe('extendSystem: named misuse', () => {
  it('throws ExtendSystemError naming an unknown token by its dotted path', () => {
    expect(() => extendSystem(BASE, { tokens: { colors: { nope: { value: '#fff' } } } })).toThrow(
      ExtendSystemError
    )
    expect(() => extendSystem(BASE, { tokens: { colors: { nope: { value: '#fff' } } } })).toThrow(
      'unknown token colors.nope in reference-ui'
    )
  })

  it('throws on a token that references itself', () => {
    expect(() =>
      extendSystem(BASE, { tokens: { colors: { brand: { ink: { value: '{colors.brand.ink}' } } } } })
    ).toThrow('token colors.brand.ink references itself')
  })

  it('throws on a reference to a token the base does not declare', () => {
    expect(() =>
      extendSystem(BASE, { tokens: { colors: { brand: { soft: { value: '{colors.nope}' } } } } })
    ).toThrow('refers to unknown token colors.nope in reference-ui')
  })

  it('rejects a rhythm value with a named error', () => {
    expect(() => extendSystem(BASE, { tokens: { colors: { brand: { ink: { value: '2r' } } } } })).toThrow(
      'rhythm value "2r", which extendSystem does not support yet'
    )
  })

  it('rejects a leaf with neither a value nor a light value', () => {
    expect(() => extendSystem(BASE, { tokens: { colors: { brand: { ink: { dark: '#fff' } } } } })).toThrow(
      'token colors.brand.ink needs a value or a light value'
    )
  })

  it('refuses a first argument that is not a base system', () => {
    expect(() => extendSystem(undefined as never, { tokens: {} })).toThrow(ExtendSystemError)
  })
})

describe('extendSystem: chaining', () => {
  it('merges chained overrides and emits one block from the original base', () => {
    const first = extendSystem(BASE, { tokens: { colors: { brand: { ink: { value: '#111111' } } } } })
    const chained = extendSystem(first, {
      tokens: { colors: { brand: { ink: { value: '#222222', dark: '#333333' }, accent: { value: '#444444' } } } },
    })
    const direct = extendSystem(BASE, {
      tokens: { colors: { brand: { ink: { value: '#222222', dark: '#333333' }, accent: { value: '#444444' } } } },
    })

    expect(ownTokens(chained)).toBe(ownTokens(direct))
    expect((ownTokens(chained).match(/@layer tokens \{/g) ?? []).length).toBe(2)
  })

  it('keeps the first call override for a path the second call does not touch', () => {
    const first = extendSystem(BASE, { tokens: { colors: { brand: { ink: { value: '#111111' } } } } })
    const chained = extendSystem(first, { tokens: { colors: { brand: { accent: { value: '#444444' } } } } })

    expect(declsUnder(appendedOf(chained), PORTABLE_LIGHT)).toEqual({
      '--colors-brand-ink': '#111111',
      '--colors-brand-accent': '#444444',
    })
  })
})

describe('extendSystem: the extends fragment node', () => {
  const next = extendSystem(BASE, { tokens: { colors: { brand: { ink: { value: '#0f766e', dark: '#5eead4' } } } } })

  it('contributes one extend node after the base nodes, and nothing for a plain base', () => {
    expect(fragmentNodesOf(next).map((node) => node.name)).toEqual([ICONS, NAME, `extend:${NAME}`])
    expect(fragmentNodesOf(BASE).map((node) => node.name)).toEqual([ICONS, NAME])
  })

  it('carries the merged overrides as one token call', () => {
    expect(extendFragmentNode(next)).toEqual({
      name: 'extend:reference-ui',
      bundle: ';tokens({"colors":{"brand":{"ink":{"value":"#0f766e","dark":"#5eead4"}}}})',
    })
    expect(extendFragmentNode(BASE)).toBeUndefined()
  })

  it('is accepted under extends and rejected beside its base in one field or across both', () => {
    expect(() => validateConfig({ name: 'app', include: DEFAULT_INCLUDE, extends: [next] })).not.toThrow()
    expect(() => validateConfig({ name: 'app', include: DEFAULT_INCLUDE, layers: [BASE, next] })).toThrow(
      /Entry 1 \(reference-ui\) repeats entry 0/
    )
    expect(() => validateConfig({ name: 'app', include: DEFAULT_INCLUDE, extends: [BASE, next] })).toThrow(
      /Entry 1 \(reference-ui\) repeats entry 0/
    )
    expect(() => validateConfig({ name: 'app', include: DEFAULT_INCLUDE, extends: [next], layers: [BASE] })).toThrow(
      /Entry 0 \(reference-ui\) is also listed under 'extends'/
    )
  })
})

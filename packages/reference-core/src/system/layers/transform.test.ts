import { describe, it, expect } from 'vitest'
import { createLayerCssFromContent } from './transform'

describe('createLayerCssFromContent', () => {
  it('strips top-level @layer order declaration', () => {
    const raw = '@layer base, tokens, recipes, utilities;\n\n@layer tokens { :where(:root,:host) { --foo: 1; } }'
    const out = createLayerCssFromContent(raw, 'my-system')
    expect(out).not.toMatch(/^@layer\s+base,/)
    expect(out).toMatch(/@layer my-system \{/)
  })

  it('wraps content in @layer <name> { ... }', () => {
    const raw = '@layer base, tokens;\n@layer tokens { :where(:root,:host) { --color: red; } }'
    const out = createLayerCssFromContent(raw, 'my-layer')
    expect(out).toMatch(/@layer my-layer \{[\s\S]*\}/)
  })

  it('extracts token block and re-scopes to [data-layer="<name>"]', () => {
    const raw =
      '@layer base, tokens;\n@layer tokens { :where(:root, :host) { --color: red; --space: 8px; } }'
    const out = createLayerCssFromContent(raw, 'my-system')
    expect(out).toMatch(/\[data-layer="my-system"\]\s*\{/)
    expect(out).toMatch(/--color:\s*red/)
    expect(out).toMatch(/--space:\s*8px/)
  })

  it('returns layer block even when no @layer tokens block (no [data-layer] block)', () => {
    const raw = '@layer base;\n.some-utility { color: red; }'
    const out = createLayerCssFromContent(raw, 'sys')
    expect(out).toMatch(/@layer sys \{/)
    expect(out).not.toMatch(/\[data-layer="sys"\]/)
  })
})

import { describe, expect, it } from 'vitest'
import { createPortableStylesheetFromContent } from './createPortableStylesheetFromContent'

describe('createPortableStylesheetFromContent', () => {
  it('preserves Panda layer order declaration inside the wrapped system layer', () => {
    const raw =
      '@layer base, tokens, recipes, utilities;\n\n@layer tokens { :where(:root,:host) { --foo: 1; } }'
    const out = createPortableStylesheetFromContent(raw, 'my-system')
    expect(out).toMatch(/@layer my-system \{/)
    expect(out).toMatch(/@layer base, tokens, recipes, utilities;/)
  })

  it('wraps content in @layer <name> { ... }', () => {
    const raw =
      '@layer base, tokens;\n@layer tokens { :where(:root,:host) { --color: red; } }'
    const out = createPortableStylesheetFromContent(raw, 'my-layer')
    expect(out).toMatch(/@layer my-layer \{[\s\S]*\}/)
  })

  it('extracts token block and re-scopes to [data-layer="<name>"]', () => {
    const raw =
      '@layer base, tokens;\n@layer tokens { :where(:root, :host) { --color: red; --space: 8px; } }'
    const out = createPortableStylesheetFromContent(raw, 'my-system')
    expect(out).toMatch(/\[data-layer="my-system"\]\s*\{/)
    expect(out).toMatch(/--color:\s*red/)
    expect(out).toMatch(/--space:\s*8px/)
  })

  it('removes root token declarations from the wrapped Panda output', () => {
    const raw = `@layer base, tokens, utilities;
@layer base { .root { display: block; } }
@layer tokens { :where(:root, :host) { --color: red; --space: 8px; } }
@layer utilities { .text_red { color: var(--color); } }`
    const out = createPortableStylesheetFromContent(raw, 'my-system')
    expect(out).not.toMatch(/:where\(:root,\s*:host\)/)
    expect(out).not.toMatch(/@layer tokens\s*\{/)
    expect(out).toMatch(/@layer my-system \{[\s\S]*@layer base/)
    expect(out).toMatch(/@layer my-system \{[\s\S]*@layer utilities/)
    expect(out).toMatch(/@layer my-system \{[\s\S]*@layer base, tokens, utilities;/)
    expect(out).toMatch(/\[data-layer="my-system"\]\s*\{[\s\S]*--color:\s*red;/)
  })

  it('returns portable stylesheet even when no @layer tokens block exists', () => {
    const raw = '@layer base;\n.some-utility { color: red; }'
    const out = createPortableStylesheetFromContent(raw, 'sys')
    expect(out).toMatch(/@layer sys \{/)
    expect(out).not.toMatch(/\[data-layer="sys"\]/)
  })

  it('re-scopes token theme selectors into the layer domain', () => {
    const raw = `@layer base, tokens;
@layer tokens {
  :where(:root, :host) { --color: red; }
  [data-panda-theme=dark] { --color: blue; }
}`
    const out = createPortableStylesheetFromContent(raw, 'sys')
    expect(out).toMatch(/\[data-panda-theme=dark\] \[data-layer="sys"\]:not\(\[data-panda-theme\]\)\s*\{/)
    expect(out).toMatch(/\[data-layer="sys"\]\[data-panda-theme=dark\]\s*,/)
    expect(out).toMatch(/--color:\s*blue;/)
  })

  it('re-scopes explicit light and dark theme selectors into the layer domain', () => {
    const raw = `@layer base, tokens;
@layer tokens {
  :where(:root, :host) { --color: red; }
  [data-panda-theme=light] { --color: white; }
  [data-panda-theme=dark] { --color: black; }
}`
    const out = createPortableStylesheetFromContent(raw, 'sys')
    expect(out).toMatch(/\[data-panda-theme=light\] \[data-layer="sys"\]:not\(\[data-panda-theme\]\)\s*\{/)
    expect(out).toMatch(/\[data-layer="sys"\]\[data-panda-theme=light\]\s*,/)
    expect(out).toMatch(/--color:\s*white;/)
    expect(out).toMatch(/\[data-panda-theme=dark\] \[data-layer="sys"\]:not\(\[data-panda-theme\]\)\s*\{/)
    expect(out).toMatch(/\[data-layer="sys"\]\[data-panda-theme=dark\]\s*,/)
    expect(out).toMatch(/--color:\s*black;/)
  })

  it('prevents ancestor theme selectors from overriding an explicitly themed host', () => {
    const raw = `@layer base, tokens;
@layer tokens {
  :where(:root, :host) { --color: red; }
  [data-panda-theme=light] { --color: white; }
  [data-panda-theme=dark] { --color: black; }
}`
    const out = createPortableStylesheetFromContent(raw, 'sys')
    expect(out).toContain('[data-panda-theme=light] [data-layer="sys"]:not([data-panda-theme])')
    expect(out).toContain('[data-panda-theme=dark] [data-layer="sys"]:not([data-panda-theme])')
    expect(out).not.toContain('[data-panda-theme=light] [data-layer="sys"] {')
    expect(out).not.toContain('[data-panda-theme=dark] [data-layer="sys"] {')
  })

  it('preserves non-selector at-rules from Panda token layer without selector rewriting', () => {
    const raw = `@layer base, tokens;
@layer tokens {
  :where(:root, :host) { --color: red; }
  @keyframes ping {
    from { opacity: 0; }
    to { opacity: 1; }
  }
}`
    const out = createPortableStylesheetFromContent(raw, 'sys')
    expect(out).toMatch(/@layer tokens\s*\{[\s\S]*@keyframes ping/)
    expect(out).not.toMatch(/\[data-layer="sys"\]\s*@keyframes ping/)
    expect(out).not.toMatch(/\[data-layer="sys"\]@keyframes ping/)
  })

  it('ignores braces inside token comments and strings when extracting the tokens layer', () => {
    const raw = `@layer base, tokens, utilities;
@layer tokens {
  :where(:root, :host) {
    /* keep { comment } balanced */
    --colors-demo-bg: "value { with } braces";
  }
}
@layer utilities { .text_demo { color: red; } }`
    const out = createPortableStylesheetFromContent(raw, 'sys')
    expect(out).toMatch(
      /\[data-layer="sys"\]\s*\{[\s\S]*--colors-demo-bg:\s*"value \{ with \} braces";/
    )
    expect(out).toMatch(/@layer sys \{[\s\S]*@layer utilities/)
  })

  it('re-scopes selector lists without splitting commas inside selector functions', () => {
    const raw = `@layer base, tokens;
@layer tokens {
  :where(:root, :host) { --color: red; }
  :is([data-panda-theme=dark], [data-panda-theme=dim]) { --color: blue; }
}`
    const out = createPortableStylesheetFromContent(raw, 'sys')
    expect(out).toMatch(
      /\[data-layer="sys"\]:is\(\[data-panda-theme=dark\], \[data-panda-theme=dim\]\)\s*,/
    )
    expect(out).toMatch(
      /:is\(\[data-panda-theme=dark\], \[data-panda-theme=dim\]\) \[data-layer="sys"\]:not\(\[data-panda-theme\]\)\s*\{/
    )
  })

  it('synthesizes public color token utilities when Panda did not emit them', () => {
    const raw = `@layer base, tokens;
@layer tokens {
  :where(:root, :host) {
    --colors-reference-unit-color-mode-token: rgb(219, 234, 254);
    --colors-fixture-demo-bg: #0f172a;
  }
}`
    const out = createPortableStylesheetFromContent(raw, 'sys')
    expect(out).toMatch(/\.c_referenceUnitColorModeToken\s*\{/)
    expect(out).toMatch(/color:\s*var\(--colors-reference-unit-color-mode-token\);/)
    expect(out).toMatch(/\.bg_fixtureDemoBg\s*\{/)
    expect(out).toMatch(/background:\s*var\(--colors-fixture-demo-bg\);/)
  })
})

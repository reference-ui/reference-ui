import { describe, expect, it } from 'vitest'
import { demotePandaGlobalCssLayer } from './demotePandaGlobalCssLayer'

describe('demotePandaGlobalCssLayer', () => {
  it('returns raw css unchanged when no global.css content exists', () => {
    const rawCss = '@layer base, tokens;\n@layer base { .ref-code { color: red; } }'

    expect(demotePandaGlobalCssLayer(rawCss, undefined)).toBe(rawCss)
    expect(demotePandaGlobalCssLayer(rawCss, '   ')).toBe(rawCss)
  })

  it('rewrites the matching Panda base layer into a lower-priority global layer', () => {
    const rawCss = [
      '@layer reset, base, tokens, utilities;',
      '@layer base { .ref-code { color: red; } }',
      '@layer tokens { :where(:root,:host) { --color: red; } }',
    ].join('\n')
    const globalCss = '@layer base{.ref-code{color:red;}}'

    expect(demotePandaGlobalCssLayer(rawCss, globalCss)).toBe([
      '@layer reset, global, base, tokens, utilities;',
      '@layer global { .ref-code { color: red; } }',
      '@layer tokens { :where(:root,:host) { --color: red; } }',
    ].join('\n'))
  })

  it('treats an already postprocessed global layer as an idempotent no-op', () => {
    const rawCss = [
      '@layer reset, global, base, tokens, utilities;',
      '@layer global { .ref-code { color: red; } }',
      '@layer tokens { :where(:root,:host) { --color: red; } }',
    ].join('\n')
    const globalCss = '@layer base{.ref-code{color:red;}}'

    expect(demotePandaGlobalCssLayer(rawCss, globalCss)).toBe(rawCss)
  })

  it('fails hard when the combined styles.css base layer no longer matches global.css', () => {
    const rawCss = '@layer base, tokens;\n@layer base { .ref-code { color: blue; } }'
    const globalCss = '@layer base { .ref-code { color: red; } }'

    expect(() => demotePandaGlobalCssLayer(rawCss, globalCss)).toThrow(
      'Panda global.css contract changed: expected styles.css base layer to match global.css exactly',
    )
  })

  it('fails hard when Panda styles.css no longer exposes the expected top-level layer order', () => {
    const rawCss = '@layer base { .ref-code { color: red; } }'
    const globalCss = '@layer base { .ref-code { color: red; } }'

    expect(() => demotePandaGlobalCssLayer(rawCss, globalCss)).toThrow(
      'Panda global.css contract changed: expected a top-level @layer order declaration in styles.css',
    )
  })
})
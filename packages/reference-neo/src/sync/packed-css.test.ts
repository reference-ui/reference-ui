// Unit tests for the packed-boundary stylesheet merge over synthetic css.
// They take engine-shaped upstream and own blocks and pin statement order,
// reset-strip bytes, verbatim scoping, and transitive composition. This file
// is the ONLY home for merge assertions; sync wiring proves its no-op by diff.
import { describe, expect, it } from 'vitest'
import { mergePackedStylesheets, stripResetLayer } from './packed-css.ts'

const EXTEND_CSS = `@layer extend-library {
@layer reset, global, base, tokens, recipes, utilities;
@layer reset {
  *, *::before, *::after { box-sizing: border-box }
  @media (prefers-reduced-motion: reduce) {
    *, *::before, *::after { animation-duration: 0.01ms !important }
  }
  body { min-height: 100vh }
}
@layer tokens {
  [data-layer="extend-library"] {
    --colors-demo-bg: #0f172a;
    --colors-_private-brand: #ff00ff;
  }
}
@layer utilities {
  .extend-library__c_demo { color: var(--colors-demo-bg); }
}
}
`

const EXTEND_STRIPPED = `@layer extend-library {
@layer reset, global, base, tokens, recipes, utilities;
@layer tokens {
  [data-layer="extend-library"] {
    --colors-demo-bg: #0f172a;
    --colors-_private-brand: #ff00ff;
  }
}
@layer utilities {
  .extend-library__c_demo { color: var(--colors-demo-bg); }
}
}
`

const OWN_CSS = `@layer chain-t1 {
@layer reset, global, base, tokens, recipes, utilities;
@layer reset {
  body { min-height: 100vh }
}
@layer tokens {
  :root {
    --colors-demo-bg: #0f172a;
  }
}
@layer utilities {
  .chain-t1__p_4px { padding: 4px; }
}
}
`

const OWN_NORESET = `@layer chain-t1 {
@layer reset, global, base, tokens, recipes, utilities;
@layer tokens {
  :root {
    --colors-demo-bg: #0f172a;
  }
}
@layer utilities {
  .chain-t1__p_4px { padding: 4px; }
}
}
`

// Merge goldens compose from the strip-test literal: the strip mapping is
// pinned above, so these pin statement text plus join order byte-exact.
const STATEMENT_T1 = '@layer extend-library, chain-t1;\n'
const NORMAL_GOLDEN = STATEMENT_T1 + EXTEND_STRIPPED + OWN_CSS
const NORESET_GOLDEN = STATEMENT_T1 + EXTEND_STRIPPED + OWN_NORESET

const PORTABLE_OWN = `@layer chain-t1 {
@layer reset, global, base, tokens, recipes, utilities;
@layer reset {
  body { min-height: 100vh }
}
@layer tokens {
  [data-layer="chain-t1"] {
    --colors-demo-bg: #0f172a;
  }
}
}
`

const EXTEND2_CSS = `@layer extend-library-2 {
@layer reset, global, base, tokens, recipes, utilities;
@layer reset {
  body { margin: 0 }
}
@layer utilities {
  .extend-library-2__m_2px { margin: 2px; }
}
}
`

const APP_CSS = `@layer app {
@layer reset, global, base, tokens, recipes, utilities;
@layer reset {
  body { margin: 0 }
}
@layer utilities {
  .app__p_1px { padding: 1px; }
}
}
`

// Diamond inputs share one base block: both outers republish it, so the
// merged sheet carries its bytes twice while the statement names it once.
const OUTER_BASE = `@layer base-lib {
@layer reset, global, base, tokens, recipes, utilities;
@layer utilities {
  .base-lib__c_bg { color: var(--colors-base-bg); }
}
}
`

function outerLeaf(name: string, rule: string): string {
  return `@layer ${name} {
@layer reset, global, base, tokens, recipes, utilities;
@layer reset {
  body { margin: 0 }
}
@layer utilities {
  ${rule}
}
}
`
}

const OUTER_A_CSS =
  '@layer base-lib, outer-a;\n' + OUTER_BASE + outerLeaf('outer-a', '.outer-a__p_2px { padding: 2px; }')
const OUTER_B_CSS =
  '@layer base-lib, outer-b;\n' + OUTER_BASE + outerLeaf('outer-b', '.outer-b__p_3px { padding: 3px; }')

const DUP_CSS = `@layer dup {
@layer utilities {
  .dup__x { color: red; }
}
}
`

const MID_CSS = `@layer base-lib, mid-lib;
@layer base-lib {
@layer reset, global, base, tokens, recipes, utilities;
@layer tokens {
  [data-layer="base-lib"] {
    --colors-base-bg: #111111;
  }
}
@layer utilities {
  .base-lib__c_bg { color: var(--colors-base-bg); }
}
}
@layer mid-lib {
@layer reset, global, base, tokens, recipes, utilities;
@layer reset {
  body { min-height: 100vh }
}
@layer tokens {
  [data-layer="mid-lib"] {
    --colors-mid-bg: #222222;
  }
}
}
`

const MID_STRIPPED = `@layer base-lib, mid-lib;
@layer base-lib {
@layer reset, global, base, tokens, recipes, utilities;
@layer tokens {
  [data-layer="base-lib"] {
    --colors-base-bg: #111111;
  }
}
@layer utilities {
  .base-lib__c_bg { color: var(--colors-base-bg); }
}
}
@layer mid-lib {
@layer reset, global, base, tokens, recipes, utilities;
@layer tokens {
  [data-layer="mid-lib"] {
    --colors-mid-bg: #222222;
  }
}
}
`

const TRANSITIVE_GOLDEN = '@layer base-lib, mid-lib, app;\n' + MID_STRIPPED + APP_CSS

const LEGACY_CSS = `@layer old-lib {
@layer tokens {
  [data-layer="old-lib"] {
    --colors-old-bg: #333333;
  }
}
}
`

const UNBALANCED_CSS = `@layer fragile {
@layer reset {
  body { margin: 0 }
`

function count(haystack: string, needle: string): number {
  return haystack.split(needle).length - 1
}

describe('stripResetLayer', () => {
  it('removes the reset block byte-exact, nested @media and all', () => {
    expect(stripResetLayer(EXTEND_CSS)).toBe(EXTEND_STRIPPED)
  })

  it('leaves the inner prelude naming reset untouched', () => {
    expect(stripResetLayer(EXTEND_CSS)).toContain(
      '@layer reset, global, base, tokens, recipes, utilities;'
    )
  })

  it('strips a transitive payload down to its resetless blocks', () => {
    expect(stripResetLayer(MID_CSS)).toBe(MID_STRIPPED)
  })

  it('no-ops byte-identical on resetless payloads', () => {
    expect(stripResetLayer(OWN_NORESET)).toBe(OWN_NORESET)
  })

  it('no-ops byte-identical on legacy payloads without any prelude', () => {
    expect(stripResetLayer(LEGACY_CSS)).toBe(LEGACY_CSS)
  })

  it('keeps an unbalanced opener verbatim instead of throwing', () => {
    expect(stripResetLayer(UNBALANCED_CSS)).toBe(UNBALANCED_CSS)
  })
})

describe('mergePackedStylesheets statement', () => {
  it('lists extends in declared order with self last', () => {
    const merged = mergePackedStylesheets(
      [
        { name: 'extend-library', css: EXTEND_CSS },
        { name: 'extend-library-2', css: EXTEND2_CSS },
      ],
      APP_CSS,
      'app'
    )
    const [statement] = merged.split('\n')
    expect(statement).toBe('@layer extend-library, extend-library-2, app;')
    const first = merged.indexOf('@layer extend-library {')
    const second = merged.indexOf('@layer extend-library-2 {')
    const self = merged.indexOf('@layer app {')
    expect(first).toBeGreaterThan(-1)
    expect(second).toBeGreaterThan(first)
    expect(self).toBeGreaterThan(second)
    expect(count(merged, '@layer reset {')).toBe(1)
  })

  it('dedups diamond names by first occurrence while blocks repeat', () => {
    const merged = mergePackedStylesheets(
      [
        { name: 'outer-a', css: OUTER_A_CSS },
        { name: 'outer-b', css: OUTER_B_CSS },
      ],
      APP_CSS,
      'app'
    )
    const [statement] = merged.split('\n')
    expect(statement).toBe('@layer base-lib, outer-a, outer-b, app;')
    expect(count(merged, '@layer base-lib, outer-a;')).toBe(1)
    expect(count(merged, '@layer base-lib, outer-b;')).toBe(1)
    expect(count(merged, '.base-lib__c_bg')).toBe(2)
    expect(count(merged, '@layer reset {')).toBe(1)
    expect(merged.endsWith(APP_CSS)).toBe(true)
  })

  it('dedups a directly repeated extends name once in the statement', () => {
    const merged = mergePackedStylesheets(
      [
        { name: 'dup', css: DUP_CSS },
        { name: 'dup', css: DUP_CSS },
      ],
      APP_CSS,
      'app'
    )
    const [statement] = merged.split('\n')
    expect(statement).toBe('@layer dup, app;')
    expect(count(merged, '.dup__x')).toBe(2)
  })

  it('composes a two-level upstream statement-first with its closure', () => {
    const merged = mergePackedStylesheets([{ name: 'mid-lib', css: MID_CSS }], APP_CSS, 'app')
    expect(merged).toBe(TRANSITIVE_GOLDEN)
    expect(count(merged, '@layer reset {')).toBe(1)
  })
})

describe('mergePackedStylesheets reset', () => {
  it('merges upstream reset-stripped plus the own block byte-exact', () => {
    expect(
      mergePackedStylesheets([{ name: 'extend-library', css: EXTEND_CSS }], OWN_CSS, 'chain-t1')
    ).toBe(NORMAL_GOLDEN)
  })

  it('leaves zero reset blocks for a normalizeCss:false consumer', () => {
    const merged = mergePackedStylesheets(
      [{ name: 'extend-library', css: EXTEND_CSS }],
      OWN_NORESET,
      'chain-t1'
    )
    expect(merged).toBe(NORESET_GOLDEN)
    expect(count(merged, '@layer reset {')).toBe(0)
  })
})

describe('mergePackedStylesheets scoping', () => {
  it('keeps upstream vars under [data-layer] and nothing hoisted to :root', () => {
    const merged = mergePackedStylesheets(
      [{ name: 'extend-library', css: EXTEND_CSS }],
      OWN_CSS,
      'chain-t1'
    )
    expect(merged).toContain(
      '[data-layer="extend-library"] {\n    --colors-demo-bg: #0f172a;\n    --colors-_private-brand: #ff00ff;\n  }'
    )
    const ownPart = merged.slice(merged.indexOf('@layer chain-t1 {'))
    expect(ownPart).not.toContain('_private')
    expect(count(merged, '_private')).toBe(count(EXTEND_CSS, '_private'))
    expect(merged).not.toContain('[data-layer="chain-t1"]')
  })
})

describe('mergePackedStylesheets assemblies', () => {
  it('serves the portable assembly through the same function unchanged', () => {
    const merged = mergePackedStylesheets(
      [{ name: 'extend-library', css: EXTEND_CSS }],
      PORTABLE_OWN,
      'chain-t1'
    )
    expect(merged.startsWith(STATEMENT_T1)).toBe(true)
    expect(merged.endsWith(PORTABLE_OWN)).toBe(true)
    expect(merged).toContain('[data-layer="extend-library"]')
    expect(merged).toContain('[data-layer="chain-t1"]')
  })

  it('no-ops byte-identical with no upstreams at all', () => {
    expect(mergePackedStylesheets([], OWN_CSS, 'chain-t1')).toBe(OWN_CSS)
  })

  it('no-ops byte-identical when every upstream css is missing or empty', () => {
    expect(
      mergePackedStylesheets(
        [{ name: 'ghost' }, { name: 'blank', css: '' }, { name: 'space', css: '  \n ' }],
        OWN_CSS,
        'chain-t1'
      )
    ).toBe(OWN_CSS)
  })
})

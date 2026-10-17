// Golden corpus for the structured-stylesheet merge: hand-written whole-string
// sheets plus the entries split from them. Entries derive from the literals through a
// fail-loud splitter, so the literals stay the single source of truth and the
// reprint pins prove the split. Stripped variants stay hand-written: they are
// expected merge outputs, never derivations. Persists as the goldens.

import type { SystemStreams } from './types.ts'
import { splitEntry } from './streams-split.ts'

export const PREAMBLE = '@layer reset, global, base, tokens, recipes, utilities;\n'

/** Baked root-default block, verbatim engine bytes; engine sheets open with it. */
export const ROOT_DEFAULT = '@layer root {\n  :root { --spacing-root: 0.25rem }\n}\n'

export const EXTEND_CSS = `@layer extend-library {
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

export const EXTEND_STRIPPED = `@layer extend-library {
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

export const EXTEND_ENTRY = splitEntry('extend-library', ROOT_DEFAULT + EXTEND_CSS, { wrapped: true, pkg: 'extend-library' })

export const EXTEND2_CSS = `@layer extend-library-2 {
@layer reset, global, base, tokens, recipes, utilities;
@layer reset {
  body { margin: 0 }
}
@layer utilities {
  .extend-library-2__m_2px { margin: 2px; }
}
}
`

export const EXTEND2_ENTRY = splitEntry('extend-library-2', ROOT_DEFAULT + EXTEND2_CSS, { wrapped: true, pkg: 'extend-library-2' })

export const OWN_CSS = `@layer chain-t1 {
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

export const T1_PORTABLE_CSS = `@layer chain-t1 {
@layer reset, global, base, tokens, recipes, utilities;
@layer reset {
  body { min-height: 100vh }
}
@layer tokens {
  [data-layer="chain-t1"] {
    --colors-demo-bg: #0f172a;
  }
}
@layer utilities {
  .chain-t1__p_4px { padding: 4px; }
}
}
`

const T1_SERVED = splitEntry('chain-t1', ROOT_DEFAULT + OWN_CSS, { tokensField: 'tokens', wrapped: true, pkg: 'chain-t1' })
const T1_PORTABLE = splitEntry('chain-t1', ROOT_DEFAULT + T1_PORTABLE_CSS, { wrapped: true, pkg: 'chain-t1' })
export const T1_OWN: SystemStreams = { ...T1_SERVED, tokensPortable: T1_PORTABLE.tokensPortable }

export const OWN_NORESET_CSS = `@layer chain-t1 {
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

const T1_NORESET_SERVED = splitEntry('chain-t1', ROOT_DEFAULT + OWN_NORESET_CSS, { tokensField: 'tokens', wrapped: true, pkg: 'chain-t1' })
export const T1_NORESET_OWN: SystemStreams = { ...T1_NORESET_SERVED, tokensPortable: T1_OWN.tokensPortable }

export const APP_CSS = `@layer app {
@layer reset, global, base, tokens, recipes, utilities;
@layer reset {
  body { margin: 0 }
}
@layer utilities {
  .app__p_1px { padding: 1px; }
}
}
`

export const APP_OWN = splitEntry('app', ROOT_DEFAULT + APP_CSS, { wrapped: true, pkg: 'app' })

export const SHARED_BASE_CSS = `@layer base-lib {
@layer reset, global, base, tokens, recipes, utilities;
@layer utilities {
  .base-lib__c_bg { color: var(--colors-base-bg); }
}
}
`

export const SHARED_BASE_ENTRY = splitEntry('base-lib', ROOT_DEFAULT + SHARED_BASE_CSS, { wrapped: true, pkg: 'base-lib' })

export const OUTER_A_CSS = `@layer outer-a {
@layer reset, global, base, tokens, recipes, utilities;
@layer reset {
  body { margin: 0 }
}
@layer utilities {
  .outer-a__p_2px { padding: 2px; }
}
}
`

export const OUTER_A_ENTRY = splitEntry('outer-a', ROOT_DEFAULT + OUTER_A_CSS, { wrapped: true, pkg: 'outer-a' })
export const OUTER_B_ENTRY: SystemStreams = {
  ...OUTER_A_ENTRY,
  name: 'outer-b',
  utilities: `@layer utilities {
  .outer-b__p_3px { padding: 3px; }
}
`,
  package: 'outer-b',
}

export const OUTER_A_STRIPPED = `@layer outer-a {
@layer reset, global, base, tokens, recipes, utilities;
@layer utilities {
  .outer-a__p_2px { padding: 2px; }
}
}
`

export const OUTER_B_STRIPPED = `@layer outer-b {
@layer reset, global, base, tokens, recipes, utilities;
@layer utilities {
  .outer-b__p_3px { padding: 3px; }
}
}
`

export const MID_BASE_BLOCK = `@layer base-lib {
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
`

export const MID_BASE_ENTRY = splitEntry('base-lib', ROOT_DEFAULT + MID_BASE_BLOCK, { wrapped: true, pkg: 'base-lib' })

export const MID_OWN_BLOCK = `@layer mid-lib {
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

export const MID_OWN_STRIPPED = `@layer mid-lib {
@layer reset, global, base, tokens, recipes, utilities;
@layer tokens {
  [data-layer="mid-lib"] {
    --colors-mid-bg: #222222;
  }
}
}
`

export const MID_ENTRY = splitEntry('mid-lib', ROOT_DEFAULT + MID_OWN_BLOCK, { wrapped: true, pkg: 'mid-lib' })

export const LEGACY_CSS = `@layer old-lib {
@layer tokens {
  [data-layer="old-lib"] {
    --colors-old-bg: #333333;
  }
}
}
`

export const LEGACY_ENTRY = splitEntry('old-lib', LEGACY_CSS, { wrapped: true, pkg: 'old-lib' })

export const RICH_CSS = `@layer rich-lib {
@layer reset, global, base, tokens, recipes, utilities;
@layer reset {
  body { margin: 0 }
}
@layer global {
  body { color: var(--colors-ink); }
}
@layer tokens {
  [data-layer="rich-lib"] {
    --colors-ink: #111111;
  }
}
@layer recipes {
  .rich-lib__r_card { padding: 4px; }
}
@layer utilities {
  .rich-lib__p_1px { padding: 1px; }
}
}
`

export const RICH_STRIPPED = `@layer rich-lib {
@layer reset, global, base, tokens, recipes, utilities;
@layer global {
  body { color: var(--colors-ink); }
}
@layer tokens {
  [data-layer="rich-lib"] {
    --colors-ink: #111111;
  }
}
@layer recipes {
  .rich-lib__r_card { padding: 4px; }
}
@layer utilities {
  .rich-lib__p_1px { padding: 1px; }
}
}
`

export const RICH_ENTRY = splitEntry('rich-lib', ROOT_DEFAULT + RICH_CSS, { wrapped: true, pkg: 'rich-lib' })

export const FLAT_CSS = `@layer reset, global, base, tokens, recipes, utilities;
@layer utilities {
  .flat-lib__p_1px { padding: 1px; }
}
`

export const FLAT_ENTRY = splitEntry('flat-lib', ROOT_DEFAULT + FLAT_CSS, { wrapped: false })
export const SCOPED_ENTRY = splitEntry('@scope/pkg', ROOT_DEFAULT + FLAT_CSS, { wrapped: false, pkg: '@scope/pkg' })
export const DIGIT_ENTRY = splitEntry('2xl-lib', ROOT_DEFAULT + FLAT_CSS, { wrapped: false, pkg: '2xl-lib' })

export const STATEMENT_T1 = '@layer extend-library, chain-t1;\n'
export const NORMAL_GOLDEN = ROOT_DEFAULT + STATEMENT_T1 + EXTEND_STRIPPED + OWN_CSS
export const NORESET_GOLDEN = ROOT_DEFAULT + STATEMENT_T1 + EXTEND_STRIPPED + OWN_NORESET_CSS
export const TRANSITIVE_STREAMS_GOLDEN =
  ROOT_DEFAULT + '@layer base-lib, mid-lib, app;\n' + MID_BASE_BLOCK + MID_OWN_STRIPPED + APP_CSS

export function countOccurrences(haystack: string, needle: string): number {
  return haystack.split(needle).length - 1
}

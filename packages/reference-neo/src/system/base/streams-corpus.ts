// Golden corpus for the structured-stylesheet merge: hand-written packed sheets
// plus the entries split from them. Entries derive from the literals through a
// fail-loud splitter, so the literals stay the single source of truth and the
// reprint pins prove the split. Stripped variants stay hand-written: they are
// expected merge outputs, never derivations. Persists past S5 as the goldens.

import type { SystemStreams } from './types.ts'

export const PREAMBLE = '@layer reset, global, base, tokens, recipes, utilities;\n'

const BLOCK_OPEN = /^@layer ([A-Za-z-]+) \{\n/
const PREAMBLE_LINE = /^@layer [^;{]+;\n/

const CHUNK_FIELDS = {
  reset: 'reset',
  global: 'global',
  recipes: 'recipes',
  utilities: 'utilities',
} as const

type TokensField = 'tokens' | 'tokensPortable'

interface SplitOptions {
  tokensField?: TokensField
  wrapped: boolean
  pkg?: string
}

function unwrapEntry(name: string, css: string): string {
  const open = css.indexOf('\n')
  const close = css.lastIndexOf('}\n')
  if (open === -1 || close === -1 || close <= open) {
    throw new Error(`splitEntry(${name}): expected a package-wrapped sheet`)
  }
  return css.slice(open + 1, close)
}

function topLevelStarts(inner: string): number[] {
  const starts: number[] = []
  let depth = 0
  for (let i = 0; i < inner.length; i += 1) {
    const ch = inner[i]
    if (ch === '{') depth += 1
    else if (ch === '}') depth -= 1
    else if (depth === 0 && inner.startsWith('@layer', i) && (i === 0 || inner[i - 1] === '\n')) {
      starts.push(i)
    }
  }
  return starts
}

function splitTopLevel(inner: string): string[] {
  const starts = topLevelStarts(inner)
  return starts.map((start, index) => inner.slice(start, starts[index + 1] ?? inner.length))
}

function assignChunk(name: string, entry: SystemStreams, chunk: string, field: TokensField): void {
  if (PREAMBLE_LINE.test(chunk)) {
    entry.preamble = chunk
    return
  }
  const kind = BLOCK_OPEN.exec(chunk)?.[1]
  if (kind === undefined) {
    throw new Error(`splitEntry(${name}): unrecognized chunk ${JSON.stringify(chunk.slice(0, 40))}`)
  }
  if (kind === 'tokens') {
    entry[field] = chunk
    return
  }
  const target = (CHUNK_FIELDS as Record<string, 'reset' | 'global' | 'recipes' | 'utilities'>)[kind]
  if (target === undefined) {
    throw new Error(`splitEntry(${name}): unknown layer kind ${JSON.stringify(kind)}`)
  }
  entry[target] = chunk
}

/** Split one packed sheet into its per-layer entry; unknown chunks throw. */
function splitEntry(name: string, css: string, options: SplitOptions): SystemStreams {
  const inner = options.wrapped ? unwrapEntry(name, css) : css
  const entry: SystemStreams = { name, preamble: '' }
  const field = options.tokensField ?? 'tokensPortable'
  for (const chunk of splitTopLevel(inner)) assignChunk(name, entry, chunk, field)
  if (options.pkg !== undefined) entry.package = options.pkg
  return entry
}

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

export const EXTEND_ENTRY = splitEntry('extend-library', EXTEND_CSS, { wrapped: true, pkg: 'extend-library' })

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

export const EXTEND2_ENTRY = splitEntry('extend-library-2', EXTEND2_CSS, { wrapped: true, pkg: 'extend-library-2' })

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

const T1_SERVED = splitEntry('chain-t1', OWN_CSS, { tokensField: 'tokens', wrapped: true, pkg: 'chain-t1' })
const T1_PORTABLE = splitEntry('chain-t1', T1_PORTABLE_CSS, { wrapped: true, pkg: 'chain-t1' })
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

const T1_NORESET_SERVED = splitEntry('chain-t1', OWN_NORESET_CSS, { tokensField: 'tokens', wrapped: true, pkg: 'chain-t1' })
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

export const APP_OWN = splitEntry('app', APP_CSS, { wrapped: true, pkg: 'app' })

export const SHARED_BASE_CSS = `@layer base-lib {
@layer reset, global, base, tokens, recipes, utilities;
@layer utilities {
  .base-lib__c_bg { color: var(--colors-base-bg); }
}
}
`

export const SHARED_BASE_ENTRY = splitEntry('base-lib', SHARED_BASE_CSS, { wrapped: true, pkg: 'base-lib' })

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

export const OUTER_A_ENTRY = splitEntry('outer-a', OUTER_A_CSS, { wrapped: true, pkg: 'outer-a' })
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

export const MID_BASE_ENTRY = splitEntry('base-lib', MID_BASE_BLOCK, { wrapped: true, pkg: 'base-lib' })

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

export const MID_ENTRY = splitEntry('mid-lib', MID_OWN_BLOCK, { wrapped: true, pkg: 'mid-lib' })

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

export const RICH_ENTRY = splitEntry('rich-lib', RICH_CSS, { wrapped: true, pkg: 'rich-lib' })

export const FLAT_CSS = `@layer reset, global, base, tokens, recipes, utilities;
@layer utilities {
  .flat-lib__p_1px { padding: 1px; }
}
`

export const FLAT_ENTRY = splitEntry('flat-lib', FLAT_CSS, { wrapped: false })
export const SCOPED_ENTRY = splitEntry('@scope/pkg', FLAT_CSS, { wrapped: false, pkg: '@scope/pkg' })
export const DIGIT_ENTRY = splitEntry('2xl-lib', FLAT_CSS, { wrapped: false, pkg: '2xl-lib' })

export const STATEMENT_T1 = '@layer extend-library, chain-t1;\n'
export const NORMAL_GOLDEN = STATEMENT_T1 + EXTEND_STRIPPED + OWN_CSS
export const NORESET_GOLDEN = STATEMENT_T1 + EXTEND_STRIPPED + OWN_NORESET_CSS
export const TRANSITIVE_STREAMS_GOLDEN =
  '@layer base-lib, mid-lib, app;\n' + MID_BASE_BLOCK + MID_OWN_STRIPPED + APP_CSS

export function countOccurrences(haystack: string, needle: string): number {
  return haystack.split(needle).length - 1
}

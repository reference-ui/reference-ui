// Packed-boundary stylesheet merge for extends chains.
// It takes upstream stylesheets plus the consumer's own block and emits one
// cascade-correct sheet: a top-level @layer statement listing the merged set,
// then upstream blocks verbatim-but-reset-stripped, then the own block
// verbatim. One function serves both assemblies: the served sheet passes its
// :root-hoisted own block, the published portable passes its self-scoped own
// block — upstream payloads are portable in both cases.

/** One extends entry's contribution to the merge: system name plus its css. */
export interface PackedUpstream {
  name: string
  css?: string
}

interface ResolvedUpstream {
  name: string
  css: string
}

/** Leading `@layer a, b;` statement — the `{` exclusion rejects block opens. */
const LEADING_STATEMENT = /^\s*@layer\s+([^;{]+);/

/** Block-form reset open; the inner prelude (`reset, …;`) never matches. */
const RESET_OPEN = /@layer\s+reset\s*\{/g

function hasCss(entry: PackedUpstream): entry is PackedUpstream & { css: string } {
  return (entry.css ?? '').trim() !== ''
}

function matchCloseBrace(css: string, from: number): number {
  let depth = 1
  for (let i = from; i < css.length; i += 1) {
    if (css[i] === '{') depth += 1
    else if (css[i] === '}') {
      depth -= 1
      if (depth === 0) return i
    }
  }
  return -1
}

interface ResetSpan {
  start: number
  end: number
}

function findResetBlock(css: string): ResetSpan | undefined {
  RESET_OPEN.lastIndex = 0
  const open = RESET_OPEN.exec(css)
  if (open === null) return undefined
  const close = matchCloseBrace(css, open.index + open[0].length)
  if (close === -1) return undefined
  return { start: open.index, end: css[close + 1] === '\n' ? close + 2 : close + 1 }
}

/**
 * Remove every `@layer reset {…}` block (balanced-brace, so nested @media
 * survive the scan boundary) plus one trailing newline each. Resetless or
 * legacy payloads pass through byte-identical; an unmatched opener keeps the
 * remainder verbatim instead of throwing.
 */
export function stripResetLayer(css: string): string {
  let out = ''
  let rest = css
  for (;;) {
    const found = findResetBlock(rest)
    if (found === undefined) return out + rest
    out += rest.slice(0, found.start)
    rest = rest.slice(found.end)
  }
}

/**
 * Layer names an upstream payload contributes to the merged statement: its
 * own leading statement when it carries one (transitive induction — a merged
 * publisher already lists its closure), else its bare system name. Legacy and
 * resetless payloads carry no statement, so they contribute exactly one name.
 */
function contributedNames(entry: ResolvedUpstream): string[] {
  const match = LEADING_STATEMENT.exec(entry.css)
  if (match === null) return [entry.name]
  const names = match[1]
    .split(',')
    .map(name => name.trim())
    .filter(name => name !== '')
  return names.length === 0 ? [entry.name] : names
}

function collectLayerNames(upstreams: readonly ResolvedUpstream[], selfName: string): string[] {
  const seen = new Set<string>()
  const names: string[] = []
  for (const entry of upstreams) {
    for (const name of contributedNames(entry)) {
      if (seen.has(name)) continue
      seen.add(name)
      names.push(name)
    }
  }
  // Self stays last even against a pathological self-extends entry.
  return [...names.filter(name => name !== selfName), selfName]
}

function appendBlock(assembled: string, block: string): string {
  if (block === '') return assembled
  const gap = assembled === '' || assembled.endsWith('\n') ? '' : '\n'
  return `${assembled}${gap}${block}`
}

/**
 * Assemble the merged sheet: statement-first, then each upstream payload in
 * declared order with resets stripped, then the own block verbatim (the
 * consumer's own reset rides its block, so `normalizeCss: false` opts the
 * whole subtree out). The statement dedups by name at first-occurrence
 * positions while blocks may repeat (diamond duplicates are identical bytes).
 * With no usable upstream css the own block returns byte-identical — no
 * statement, no join, nothing to diff.
 */
export function mergePackedStylesheets(
  upstreams: readonly PackedUpstream[],
  own: string,
  selfName: string
): string {
  const merged = upstreams.filter(hasCss)
  if (merged.length === 0) return own
  let out = `@layer ${collectLayerNames(merged, selfName).join(', ')};\n`
  for (const entry of merged) out = appendBlock(out, stripResetLayer(entry.css))
  return appendBlock(out, own)
}

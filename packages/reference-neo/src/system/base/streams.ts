// Structured-stylesheet merge for extends chains over per-system streams.
// It takes upstream stream arrays plus the consumer's own N-API object and emits
// both merged sheets plus the published payload in one call. The served sheet takes
// the own :root-hoisted tokens, the portable sheet the own self-scoped tokens, while
// upstream entries print their portable tokens resetless in both. Ported 1:1 from the
// packed-css oracle the S5 cutover deleted; the golden corpus holds the join now.

import type { SystemStreams } from './types.ts'

/** One extends entry's contribution to the merge: system name plus its streams. */
export interface StreamUpstream {
  name: string
  streams?: SystemStreams[]
}

/** Both merged sheets plus the published structured payload, computed once. */
export interface MergedSheets {
  /** Served: upstream portable blocks plus the own :root-hoisted block. */
  stylesheet: string
  /** Published string: upstream portable blocks plus the own self-scoped block. */
  portableStylesheet: string
  /** Published structured payload: the upstream expansion plus the own entry. */
  streams: SystemStreams[]
}

function isUsable(entry: StreamUpstream): entry is StreamUpstream & { streams: SystemStreams[] } {
  return entry.streams != null && entry.streams.length > 0
}

function isAsciiDigit(code: number): boolean {
  return code >= 0x30 && code <= 0x39
}

/** Rust `char::is_control`: general category Cc, the two ASCII-adjacent runs. */
function isControl(code: number): boolean {
  return code <= 0x1f || (code >= 0x7f && code <= 0x9f)
}

function isIdentBody(code: number): boolean {
  return (
    (code >= 0x61 && code <= 0x7a) ||
    (code >= 0x41 && code <= 0x5a) ||
    (code >= 0x30 && code <= 0x39) ||
    code === 0x5f ||
    code === 0x2d
  )
}

function hexEscape(code: number): string {
  return `\\${code.toString(16)} `
}

function escapeChar(code: number, ch: string, index: number): string {
  if (index === 0 && (isAsciiDigit(code) || code === 0x2d)) return hexEscape(code)
  if (isControl(code)) return hexEscape(code)
  if (isIdentBody(code)) return ch
  return `\\${ch}`
}

/** CSS-identifier escape ported from the engine's escape_css_selector. */
function escapeSelector(value: string): string {
  let out = ''
  let index = 0
  for (const ch of value) {
    out += escapeChar(ch.codePointAt(0) ?? 0, ch, index)
    index += 1
  }
  return out
}

/** Nest a reprinted sheet inside the system's package layer; empty stays flat. */
function wrapPackageLayer(pkg: string, inner: string): string {
  if (pkg === '') return inner
  return `@layer ${escapeSelector(pkg)} {\n${inner}}\n`
}

/** Reprint one upstream entry portable and resetless: reset drops, never concats. */
function printUpstreamBlock(entry: SystemStreams): string {
  return wrapPackageLayer(
    entry.package ?? '',
    (entry.preamble ?? '') +
      (entry.global ?? '') +
      (entry.tokensPortable ?? '') +
      (entry.recipes ?? '') +
      (entry.utilities ?? '')
  )
}

/** Reprint the own object verbatim in one token variant; the own reset rides. */
function printOwnBlock(own: SystemStreams, tokens: string | undefined): string {
  return wrapPackageLayer(
    own.package ?? '',
    (own.preamble ?? '') +
      (own.reset ?? '') +
      (own.global ?? '') +
      (tokens ?? '') +
      (own.recipes ?? '') +
      (own.utilities ?? '')
  )
}

function collectEntryNames(entries: readonly SystemStreams[], selfName: string): string[] {
  const seen = new Set<string>()
  const names: string[] = []
  for (const entry of entries) {
    if (seen.has(entry.name)) continue
    seen.add(entry.name)
    names.push(entry.name)
  }
  // Self stays last even against a pathological self-extends entry.
  return [...names.filter((name) => name !== selfName), selfName]
}

function appendBlock(assembled: string, block: string): string {
  if (block === '') return assembled
  const gap = assembled === '' || assembled.endsWith('\n') ? '' : '\n'
  return `${assembled}${gap}${block}`
}

/** Project the N-API own object onto its published entry: tokens never ship. */
export function toPublishedEntry(own: SystemStreams): SystemStreams {
  return {
    name: own.name,
    preamble: own.preamble,
    reset: own.reset,
    global: own.global,
    tokensPortable: own.tokensPortable,
    recipes: own.recipes,
    utilities: own.utilities,
    package: own.package,
  }
}

/**
 * Assemble the merged sheets: statement-first, then each usable upstream's
 * entries in order reprinted portable and resetless, then the own block
 * verbatim in both token variants (the consumer's own reset rides its block,
 * so `normalizeCss: false` opts the whole subtree out). The statement dedups
 * by name at first-occurrence positions while blocks may repeat (diamond
 * duplicates are identical bytes). With no usable upstreams both sheets
 * reprint the own object byte-identical to the engine concat — no statement,
 * no join, nothing to diff. One call returns all three; the statement
 * computes once.
 */
export function mergeStreams(
  upstreams: readonly StreamUpstream[],
  own: SystemStreams,
  selfName: string
): MergedSheets {
  const expansion = upstreams.filter(isUsable).flatMap((entry) => entry.streams)
  const streams = [...expansion, toPublishedEntry(own)]
  if (expansion.length === 0) {
    return {
      stylesheet: printOwnBlock(own, own.tokens),
      portableStylesheet: printOwnBlock(own, own.tokensPortable),
      streams,
    }
  }
  const statement = `@layer ${collectEntryNames(expansion, selfName).join(', ')};\n`
  let stylesheet = statement
  let portableStylesheet = statement
  for (const entry of expansion) {
    const block = printUpstreamBlock(entry)
    stylesheet = appendBlock(stylesheet, block)
    portableStylesheet = appendBlock(portableStylesheet, block)
  }
  return {
    stylesheet: appendBlock(stylesheet, printOwnBlock(own, own.tokens)),
    portableStylesheet: appendBlock(portableStylesheet, printOwnBlock(own, own.tokensPortable)),
    streams,
  }
}

// Structured-stylesheet merge for extends chains over per-system streams.
// It takes upstream stream arrays plus the consumer's own N-API object and emits
// both merged sheets plus the published payload in one call. The served sheet takes
// the own :root-hoisted tokens, the portable sheet the own self-scoped tokens, while
// upstream entries print their portable tokens resetless and rootless in both; the
// own root default hoists ahead of the statement so it ranks below every package.
// Ported 1:1 from the packed-css oracle the S5 cutover deleted; the corpus holds the join now.

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

const FOREIGN_OPEN = /^\s*\/\* foreign .+ \*\/\s*$/
const FOREIGN_CLOSE = /^\s*\/\* end foreign .+ \*\/\s*$/

/**
 * Drop every engine-delimited foreign section from a utilities block: the
 * `foreign <q>` open marker through its `end foreign <q>` close, inclusive.
 * Foreign-qualified rules resolve against the consumer's tokens, so they are
 * valid only on the resolving page: an entry a downstream compose copies must
 * contribute own-qualified rules only. Missing markers pass through
 * byte-identical, so every no-external entry is untouched.
 */
function stripForeignSections(utilities: string): string {
  if (!utilities.includes('/* foreign ')) return utilities
  const kept: string[] = []
  let inside = false
  for (const line of utilities.split('\n')) {
    if (FOREIGN_OPEN.test(line)) {
      inside = true
    } else if (FOREIGN_CLOSE.test(line)) {
      inside = false
    } else if (!inside) {
      kept.push(line)
    }
  }
  return kept.join('\n')
}

/** Reprint one upstream entry portable, resetless, and rootless: reset and root drop, never concat. */
function printUpstreamBlock(entry: SystemStreams): string {
  return wrapPackageLayer(
    entry.package ?? '',
    (entry.preamble ?? '') +
      (entry.global ?? '') +
      (entry.tokensPortable ?? '') +
      (entry.recipes ?? '') +
      stripForeignSections(entry.utilities ?? '')
  )
}

/** Reprint the own object verbatim in one token variant; the own reset rides. */
function printOwnBlock(own: SystemStreams, tokens: string | undefined): string {
  return (own.root ?? '') + printOwnInner(own, tokens)
}

/** The own block without the root default: the extends branch hoists it. */
function printOwnInner(own: SystemStreams, tokens: string | undefined): string {
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

// One entry per system, first occurrence kept. A diamond reaches its shared
// upstream through both branches, so the expansion lists it twice; the sheets
// print it once, where the merge first reaches it.
function firstPerSystem(entries: readonly SystemStreams[]): SystemStreams[] {
  const seen = new Set<string>()
  return entries.filter((entry) => {
    if (seen.has(entry.name)) return false
    seen.add(entry.name)
    return true
  })
}

// Names of the printed entries. Self stays last even against a pathological
// self-extends entry. Names escape at print time, so the statement names
// exactly the layers the blocks define.
function collectEntryNames(entries: readonly SystemStreams[], selfName: string): string[] {
  const names = entries.map((entry) => entry.name).filter((name) => name !== selfName)
  return [...names.map((name) => escapeSelector(name)), escapeSelector(selfName)]
}

function appendBlock(assembled: string, block: string): string {
  if (block === '') return assembled
  const gap = assembled === '' || assembled.endsWith('\n') ? '' : '\n'
  return `${assembled}${gap}${block}`
}

/** Project the N-API own object onto its published entry: tokens never ship, and
 *  the own foreign groups are stripped — a published entry contributes
 *  own-qualified rules only (the resolving page keeps them via `printOwnInner`). */
export function toPublishedEntry(own: SystemStreams): SystemStreams {
  return {
    name: own.name,
    root: own.root,
    preamble: own.preamble,
    reset: own.reset,
    global: own.global,
    tokensPortable: own.tokensPortable,
    recipes: own.recipes,
    utilities: own.utilities === undefined ? undefined : stripForeignSections(own.utilities),
    package: own.package,
  }
}

/**
 * Assemble the merged sheets: the own root default hoisted first (lowest
 * layer rank, so every author definition in every package wins over it),
 * then the statement, then each usable upstream's entries in order reprinted
 * portable, resetless, and rootless, then the own block verbatim in both
 * token variants (the consumer's own reset rides its block, so
 * `normalizeCss: false` opts the whole subtree out). Each system prints once,
 * at its first occurrence in the expansion: the statement and the blocks read
 * the same deduped list, so a diamond's shared upstream never repeats. The
 * published payload keeps the full expansion. With no usable upstreams both
 * sheets reprint the own object byte-identical to the engine concat — no
 * statement, no join, nothing to diff. One call returns all three; the
 * statement computes once.
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
  const printed = firstPerSystem(expansion)
  const statement = `@layer ${collectEntryNames(printed, selfName).join(', ')};\n`
  let stylesheet = own.root ?? ''
  let portableStylesheet = own.root ?? ''
  stylesheet = appendBlock(stylesheet, statement)
  portableStylesheet = appendBlock(portableStylesheet, statement)
  for (const entry of printed) {
    const block = printUpstreamBlock(entry)
    stylesheet = appendBlock(stylesheet, block)
    portableStylesheet = appendBlock(portableStylesheet, block)
  }
  return {
    stylesheet: appendBlock(stylesheet, printOwnInner(own, own.tokens)),
    portableStylesheet: appendBlock(portableStylesheet, printOwnInner(own, own.tokensPortable)),
    streams,
  }
}

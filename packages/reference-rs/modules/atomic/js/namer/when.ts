/**
 * When procedure P7: one authored condition string to skip, unknown, or a
 * known segment plus wrap kind. Mirrors `resolve/conditions/mod.rs::lower_when`
 * with its order (catalog, breakpoint, range, at-rule), prefix-match
 * at-rules, case-sensitive everything except range-name matching, bare-query
 * refusal, and the escape-aware `has_parent_reference` machine — which is
 * NOT the collapse quote machine in `value.ts`; do not unify them. Pins
 * golden `13-lowerCondition`. Wrap kind is golden-probe-only: the class
 * carries the segment alone.
 */
import type { NamerTables } from '../../../../contracts/types.js'
import { asciiLower, trimStructural } from './lexical.js'

/** Lowered condition: skip, unknown, or the known segment plus wrap kind. */
export type LoweredCondition =
  | { status: 'skip' }
  | { status: 'unknown' }
  | { status: 'known'; segment: string; kind: 'media' | 'container' | 'supports' | 'selector' }

/**
 * Preset names whose catalog wrap is `@media` (the other seven are selector
 * templates). Cites `pseudoprops::PRESETS`; golden 13 pins `_osDark`. Wraps
 * are sheet-side and unshipped, so system-only names default to selector.
 */
const MEDIA_PRESETS = new Set(['motionReduce', 'motionSafe', 'osDark', 'osLight', 'print'])

/** Query-bearing at-rule keywords the bare check consults. */
const QUERY_AT_RULES = ['@media', '@supports', '@container']

/** P7 golden: lower one `when` token into a segment, or skip/refuse it. */
export function lowerCondition(raw: string, tables: NamerTables): LoweredCondition {
  if (raw === 'base') return { status: 'skip' }
  const catalog = namedCondition(raw, tables)
  if (catalog !== undefined) return catalog
  if (raw !== 'base' && tables.breakpoints.includes(raw)) {
    return { status: 'known', segment: raw, kind: 'container' }
  }
  if (isKnownRange(raw, tables)) return { status: 'known', segment: raw, kind: 'container' }
  const stamped = atRuleOrAmpersand(raw)
  if (stamped !== undefined) return stamped
  return { status: 'unknown' }
}

/** Catalog hit: strip one `_`, test membership, segment the stripped name. */
function namedCondition(raw: string, tables: NamerTables): LoweredCondition | undefined {
  const stripped = stripOneUnderscore(raw)
  if (!tables.conditions.includes(stripped)) return undefined
  return {
    status: 'known',
    segment: stripped,
    kind: MEDIA_PRESETS.has(stripped) ? 'media' : 'selector',
  }
}

/** Strip exactly one leading `_`, not a run. */
function stripOneUnderscore(raw: string): string {
  return raw.startsWith('_') ? raw.slice(1) : raw
}

/** True for a valid `*Down`, `*Only`, or `*To*` range over the scale. Widths ride along: every corpus scale pairs names with widths. */
function isKnownRange(raw: string, tables: NamerTables): boolean {
  return (
    isDownRange(raw, tables) || isOnlyRange(raw, tables) || isBetweenRange(raw, tables)
  )
}

/** True for `bpDown` with a non-base scale member. */
function isDownRange(raw: string, tables: NamerTables): boolean {
  if (!raw.endsWith('Down')) return false
  const bp = raw.slice(0, raw.length - 4)
  return bp !== 'base' && tables.breakpoints.includes(bp)
}

/** True for `bpOnly` with a non-base scale member. */
function isOnlyRange(raw: string, tables: NamerTables): boolean {
  if (!raw.endsWith('Only')) return false
  const bp = raw.slice(0, raw.length - 4)
  return bp !== 'base' && tables.breakpoints.includes(bp)
}

/** True for `fromTo` with ordered non-base scale members, matched ASCII-insensitively. */
function isBetweenRange(raw: string, tables: NamerTables): boolean {
  const at = raw.indexOf('To')
  if (at < 0) return false
  const from = raw.slice(0, at)
  const to = raw.slice(at + 2)
  if (from === 'base' || to === 'base') return false
  const fromIdx = indexOfAsciiFold(tables.breakpoints, from)
  const toIdx = indexOfAsciiFold(tables.breakpoints, to)
  return fromIdx >= 0 && toIdx >= 0 && fromIdx < toIdx
}

/** First index ASCII-equal to the needle, or -1. */
function indexOfAsciiFold(names: string[], needle: string): number {
  const folded = asciiLower(needle)
  return names.findIndex(name => asciiLower(name) === folded)
}

/** At-rule or `&` lowering: bracketed segments, bare queries refused. */
function atRuleOrAmpersand(raw: string): LoweredCondition | undefined {
  if (startsWithAtRule(raw)) {
    if (isBareQueryRule(raw)) return undefined
    return { status: 'known', segment: bracketSegment(raw), kind: atRuleKind(raw) }
  }
  if (raw.startsWith('&') || raw.startsWith('@') || hasParentReference(raw)) {
    return { status: 'known', segment: bracketSegment(raw), kind: 'selector' }
  }
  return undefined
}

/** True for the `@media`/`@container`/`@supports` prefix match (no word boundary: `@mediafoo` is known). */
function startsWithAtRule(raw: string): boolean {
  return raw.startsWith('@media') || raw.startsWith('@container') || raw.startsWith('@supports')
}

/** Wrap kind from the at-rule prefix: media, supports, else container. */
function atRuleKind(raw: string): 'media' | 'container' | 'supports' {
  if (raw.startsWith('@media')) return 'media'
  if (raw.startsWith('@supports')) return 'supports'
  return 'container'
}

/** True when a query-bearing at-rule key carries no query text. */
function isBareQueryRule(raw: string): boolean {
  return QUERY_AT_RULES.some(
    keyword =>
      raw === keyword ||
      (raw.startsWith(keyword) && trimStructural(raw.slice(keyword.length)).length === 0)
  )
}

/** Bracketed segment: trimmed query with spaces (only spaces) mapped to `_`. */
function bracketSegment(raw: string): string {
  return '[' + trimStructural(raw).split(' ').join('_') + ']'
}

/**
 * True when a key carries an unquoted `&` parent reference. Backslash escapes
 * plus independent quote flags — distinct from P1's alternation-only machine.
 */
export function hasParentReference(key: string): boolean {
  if (!key.includes('&')) return false
  const state = new SelectorQuoteState()
  for (const ch of key) {
    if (state.step(ch)) return true
  }
  return false
}

/** Selector quote state: backslash escapes plus independent quote flags. */
class SelectorQuoteState {
  private inSingle = false
  private inDouble = false
  private escaped = false

  /** Step one char; true for an unquoted, unescaped `&`. */
  step(ch: string): boolean {
    if (this.escaped) return this.clearEscape()
    if (ch === '\\') return this.takeEscape()
    if (ch === "'") return this.toggleSingle()
    if (ch === '"') return this.toggleDouble()
    return ch === '&' && !this.inSingle && !this.inDouble
  }

  /** Consume one escaped char, never structural. */
  private clearEscape(): boolean {
    this.escaped = false
    return false
  }

  /** Open an escape run. */
  private takeEscape(): boolean {
    this.escaped = true
    return false
  }

  /** Toggle single quotes outside double quotes. */
  private toggleSingle(): boolean {
    if (!this.inDouble) this.inSingle = !this.inSingle
    return false
  }

  /** Toggle double quotes outside single quotes. */
  private toggleDouble(): boolean {
    if (!this.inSingle) this.inDouble = !this.inDouble
    return false
  }
}

/**
 * Value procedures P1-P3 plus the shared value vocabulary of the runtime namer.
 * Mirrors `normalize.rs::collapse_whitespace` (P1), `unit.rs` (P2: the fence,
 * the color exemption, the legacy refusals), and
 * `extract/expressions/literal.rs::split_important_flag` (P3, caller-side
 * split; the join re-appends). Pins goldens `07-collapseWhitespace`,
 * `08-canonNumeric`, and `09-splitImportant`. Owns `NamerValue`, the
 * plan-JSON scalar forms the interpreter and the pipeline pass around.
 */
import type { NamerTables } from '../../../../contracts/types.js'
import {
  asciiLower,
  inCanonicalMagnitude,
  isStructuralCode,
  isStructuralWhitespace,
  parseFiniteDecimal,
  renderDecimal,
  trimStructural,
} from './lexical.js'

/** Refusal code the golden pins for non-canonical numeric spellings. */
const NON_CANONICAL_NUMERIC = 'ATM-W-NON-CANONICAL-NUMERIC'
/** Refusal code the golden pins for empty strings and non-string values. */
const INVALID_CSS_VALUE = 'ATM-W-INVALID-CSS-VALUE'
/** Case-insensitive `!important` marker the split strips. */
const IMPORTANT_MARKER = '!important'

/** Plan-JSON scalar forms after `$token`/`$r` conversion, mirroring `AtomValue`. */
export type NamerValue =
  | { kind: 'string'; text: string }
  | { kind: 'number'; num: number }
  | { kind: 'token'; path: string }
  | { kind: 'boolean'; flag: boolean }
  | { kind: 'null' }

/** Stem verdict: the class stem, a refusal code, or a silent skip. */
export type StemVerdict = { stem: string } | { refused: string } | { silent: true }

/** Canonicalize through the alias table, mirroring `resolve_canonical_prop`. */
export function canonicalProp(prop: string, tables: NamerTables): string {
  return tables.aliases[prop] ?? prop
}

/**
 * P1: collapse each run of structural whitespace to one space, leaving quoted
 * substrings byte-identical. Verbatim port of Panda's collapse, including its
 * plain quote toggle: quotes nest by alternation only, with no escapes. This
 * machine is NOT the selector quote machine in `when.ts`; do not unify them.
 */
export function collapseWhitespace(value: string): string {
  const collapse = new Collapse()
  for (const ch of value) collapse.push(ch)
  return collapse.finish()
}

/** One collapse pass: the output plus the currently open quote, if any. */
class Collapse {
  private out = ''
  private quote: string | undefined

  /** Push one char: quoted text verbatim, else one space per run. */
  push(ch: string): void {
    if (this.quote !== undefined) this.pushQuoted(ch)
    else if (ch === '"' || ch === "'") {
      this.quote = ch
      this.out += ch
    } else this.pushBare(ch)
  }

  /** Collapsed output. */
  finish(): string {
    return this.out
  }

  /** Push one char inside quotes; the matching quote closes the run. */
  private pushQuoted(ch: string): void {
    this.out += ch
    if (ch === this.quote) this.quote = undefined
  }

  /** Push one unquoted char: text verbatim, one space per whitespace run. */
  private pushBare(ch: string): void {
    if (!isStructuralWhitespace(ch)) this.out += ch
    else if (!this.out.endsWith(' ')) this.out += ' '
  }
}

/**
 * P3: strip `!important` or trailing `!` from a value string. Caller-side:
 * plan capture and `css()` pre-split before `name()`; the join re-appends.
 */
export function splitImportant(val: string): { clean: string; important: boolean } {
  const marker = stripImportantMarker(val)
  if (marker !== undefined) return { clean: trimEndStructural(marker), important: true }
  if (val.length > 1 && val.endsWith('!')) {
    return { clean: val.slice(0, val.length - 1), important: true }
  }
  return { clean: val, important: false }
}

/** Strip a case-insensitive `!important` suffix, if present. */
function stripImportantMarker(val: string): string | undefined {
  if (val.length < IMPORTANT_MARKER.length) return undefined
  const tail = val.slice(val.length - IMPORTANT_MARKER.length)
  if (asciiLower(tail) !== IMPORTANT_MARKER) return undefined
  return val.slice(0, val.length - IMPORTANT_MARKER.length)
}

/** Strip L1 from the right end only, mirroring `str::trim_end`. */
function trimEndStructural(text: string): string {
  let end = text.length
  while (end > 0) {
    const width = end >= 2 && isTrailingSurrogatePair(text, end) ? 2 : 1
    const code = text.codePointAt(end - width) ?? -1
    if (!isStructuralCode(code)) break
    end -= width
  }
  return text.slice(0, end)
}

/** True when the two units before `end` form one astral code point. */
function isTrailingSurrogatePair(text: string, end: number): boolean {
  const high = text.charCodeAt(end - 2)
  const low = text.charCodeAt(end - 1)
  return high >= 0xd800 && high <= 0xdbff && low >= 0xdc00 && low <= 0xdfff
}

/** Verdict of the canonical-number attempt shared by string and bare paths. */
type CanonicalNumber =
  | { kind: 'notNumeric' }
  | { kind: 'fencedOut' }
  | { kind: 'canonical'; stem: string }

/**
 * Parse, gate, and render one numeric spelling through the lexical fence:
 * structural trim, explicit decimal grammar, finite-only, zero folds to
 * `"0"`, magnitudes outside `[1e-6, 1e21)` refuse, else canonical render.
 */
function canonicalNumber(text: string): CanonicalNumber {
  const trimmed = trimStructural(text)
  if (trimmed.length === 0) return { kind: 'notNumeric' }
  const value = parseFiniteDecimal(trimmed)
  if (value === undefined) return { kind: 'notNumeric' }
  if (value === 0) return { kind: 'canonical', stem: '0' }
  if (!inCanonicalMagnitude(value)) return { kind: 'fencedOut' }
  return { kind: 'canonical', stem: renderDecimal(value) }
}

/**
 * True when a bare number is valid: every prop except colors, where numbers
 * never paint, plus the font shorthands whose strings must survive. The two
 * font literals are baked (ask-8 C4); colors come from the shipped table.
 */
function acceptsBareNumber(canon: string, tables: NamerTables): boolean {
  return (
    !tables.colorProps.includes(canon) && canon !== 'font' && canon !== 'fontFamily'
  )
}

/**
 * P2 golden: the composed numeric verdict over one string probe. Runs the
 * `from_string` path and reports the class stem or the refusal code.
 */
export function canonNumeric(
  input: { prop: string; value: string },
  tables: NamerTables
): { stem: string } | { refused: string } {
  return fromString(canonicalProp(input.prop, tables), input.value, tables)
}

/** Resolve one pipeline scalar to its stem verdict, by value kind. */
export function scalarStem(
  canon: string,
  value: NamerValue,
  tables: NamerTables
): StemVerdict {
  switch (value.kind) {
    case 'null':
      return { silent: true }
    case 'boolean':
      return { refused: INVALID_CSS_VALUE }
    case 'number':
      return fromNumber(value.num)
    case 'token':
      return { stem: value.path }
    case 'string':
      return fromString(canon, value.text, tables)
  }
}

/** Bare-number path: re-render through the fence; non-finite keeps verbatim. Unit policy is sheet-side, so the stem needs no prop. */
function fromNumber(num: number): { stem: string } | { refused: string } {
  const spelling = String(num)
  if (isNonCanonicalNumeric(spelling)) return { refused: NON_CANONICAL_NUMERIC }
  const verdict = canonicalNumber(spelling)
  if (verdict.kind === 'canonical') return { stem: verdict.stem }
  if (verdict.kind === 'fencedOut') return { refused: NON_CANONICAL_NUMERIC }
  return { stem: spelling }
}

/** String path: collapse first, then canonicalize or fall to legacy. */
function fromString(
  canon: string,
  text: string,
  tables: NamerTables
): { stem: string } | { refused: string } {
  const collapsed = collapseWhitespace(text)
  const verdict = canonicalNumber(collapsed)
  if (verdict.kind === 'canonical' && acceptsBareNumber(canon, tables)) {
    return { stem: verdict.stem }
  }
  if (verdict.kind === 'fencedOut' && acceptsBareNumber(canon, tables)) {
    return { refused: NON_CANONICAL_NUMERIC }
  }
  return legacyStringValue(canon, collapsed, tables)
}

/** Pre-79 string path: empty and non-canonical refuse, else passthrough. */
function legacyStringValue(
  canon: string,
  collapsed: string,
  tables: NamerTables
): { stem: string } | { refused: string } {
  if (trimStructural(collapsed).length === 0) return { refused: INVALID_CSS_VALUE }
  if (isNonCanonicalNumeric(collapsed)) return { refused: NON_CANONICAL_NUMERIC }
  const numeric = parseCanonicalNumber(collapsed)
  if (numeric !== undefined && acceptsBareNumber(canon, tables)) return { stem: numeric }
  return { stem: collapsed }
}

/** True for `Infinity`/`NaN` spellings, radix prefixes, and leading zeros. */
function isNonCanonicalNumeric(s: string): boolean {
  return isNamedNonFiniteSpelling(s) || hasRadixPrefix(s) || hasLeadingZero(s)
}

/** True for exactly `Infinity`, `-Infinity`, or `NaN`. */
function isNamedNonFiniteSpelling(s: string): boolean {
  return s === 'Infinity' || s === '-Infinity' || s === 'NaN'
}

/** True for a `0x`/`0X`/`0b`/`0o` radix prefix. */
function hasRadixPrefix(s: string): boolean {
  return s.startsWith('0x') || s.startsWith('0X') || s.startsWith('0b') || s.startsWith('0o')
}

/** True for a leading zero before another digit, past one sign. */
function hasLeadingZero(s: string): boolean {
  const check = s.startsWith('-') ? s.slice(1) : s
  return check.length > 1 && check.startsWith('0') && isAsciiDigit(check.charCodeAt(1))
}

/** Canonical base-10 integer or decimal without leading zeros, if well-formed. */
function parseCanonicalNumber(s: string): string | undefined {
  if (isNonCanonicalNumeric(s)) return undefined
  const rest = s.startsWith('-') ? s.slice(1) : s
  if (rest.length === 0 || !hasDigitsAndDots(rest)) return undefined
  const dot = rest.indexOf('.')
  const intPart = dot < 0 ? rest : rest.slice(0, dot)
  if (intPart.length > 1 && intPart.startsWith('0')) return undefined
  return s
}

/** True for digits with at most one dot and at least one digit. */
function hasDigitsAndDots(rest: string): boolean {
  let hasDot = false
  let digits = 0
  for (let index = 0; index < rest.length; index += 1) {
    const code = rest.charCodeAt(index)
    if (isAsciiDigit(code)) digits += 1
    else if (code === 0x2e && !hasDot) hasDot = true
    else return false
  }
  return digits > 0
}

/** True for ASCII `0`-`9`. */
function isAsciiDigit(code: number): boolean {
  return code >= 0x30 && code <= 0x39
}

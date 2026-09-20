/**
 * Lexical functions the class stem passes through (L1-L6, no procedures).
 * Mirrors `resolve/lexical.rs`: the 25-point structural whitespace set, its
 * trim, the explicit decimal grammar with finite-gated and ungated entries,
 * the canonical renderer with the magnitude fence and the `$r` collapse
 * wrapper, ASCII-only folding, and the 3-char sanitize map. Pins goldens
 * `01-isStructuralWhitespace` through `06-sanitizeValue`. Never a host
 * default: no `Number()` without the grammar, no `String#trim`, no
 * `toLowerCase`, no whitespace regex anywhere in this file.
 */

/** Smallest magnitude that keeps its plain spelling. */
const MIN_CANONICAL_MAGNITUDE = 1e-6
/** First magnitude that renders with an exponent in JS. */
const MAX_CANONICAL_MAGNITUDE = 1e21
/** Epsilon below which an `$r` multiplier collapses to its integer rendering. */
const R_INTEGER_EPSILON = 1e-6
/** Saturating bounds of the `f as i64` cast the collapse replaces. */
const I64_MAX = 2 ** 63
const I64_MIN = -(2 ** 63)

/**
 * L1: the 25-point structural whitespace set (`White_Space`, no U+FEFF).
 * Takes one char; astral input and the empty string are never structural.
 */
export function isStructuralWhitespace(ch: string): boolean {
  const code = ch.codePointAt(0)
  if (code === undefined) return false
  return isStructuralCode(code)
}

/** The nine singleton members of the 25-point set; the other sixteen ride two ranges below. */
const STRUCTURAL_SINGLES = new Set([
  0x20, 0x85, 0xa0, 0x1680, 0x2028, 0x2029, 0x202f, 0x205f, 0x3000,
])

/** L1 over code points: U+0009-000D, U+0020, U+0085, U+00A0, U+1680, U+2000-200A, U+2028-2029, U+202F, U+205F, U+3000. Exported so the right-trim beside `splitImportant` shares the set. */
export function isStructuralCode(code: number): boolean {
  if (code >= 0x09 && code <= 0x0d) return true
  if (code >= 0x2000 && code <= 0x200a) return true
  return STRUCTURAL_SINGLES.has(code)
}

/** L2: strip L1 from both ends. Identical to `str::trim` by construction. */
export function trimStructural(text: string): string {
  return trimEndAt(text, trimStartTo(text))
}

/** Offset of the first non-structural code point. */
function trimStartTo(text: string): number {
  let start = 0
  while (start < text.length && isStructuralCode(text.codePointAt(start) ?? -1)) {
    start += (text.codePointAt(start) ?? 0) > 0xffff ? 2 : 1
  }
  return start
}

/** Text from `start` with trailing structural code points removed. */
function trimEndAt(text: string, start: number): string {
  let end = text.length
  while (end > start) {
    const width = codePointWidthAt(text, end)
    if (!isStructuralCode(text.codePointAt(end - width) ?? -1)) break
    end -= width
  }
  return text.slice(start, end)
}

/** UTF-16 width of the code point ending at `end`. */
function codePointWidthAt(text: string, end: number): number {
  if (end < 2) return 1
  const high = text.charCodeAt(end - 2)
  const low = text.charCodeAt(end - 1)
  return high >= 0xd800 && high <= 0xdbff && low >= 0xdc00 && low <= 0xdfff ? 2 : 1
}

/** L3 verdict: finite values, signed infinities, NaN, or rejection. */
export type ParseVerdict =
  | { result: 'finite'; value: number }
  | { result: 'infinite'; sign: 1 | -1 }
  | { result: 'nan' }
  | { result: 'reject' }

/**
 * L3: one decimal grammar, made explicit. Optional sign, then ASCII
 * `inf`/`infinity`/`nan` or a decimal mantissa with optional exponent.
 * Values come from `Number()` over grammar-accepted input only, so the
 * finite entry agrees with the previous bare parse bit for bit.
 */
export function parseDecimal(text: string): ParseVerdict {
  const body = stripOneSign(text)
  if (body.length === 0) return { result: 'reject' }
  const negative = text.startsWith('-')
  const named = namedNonFinite(body)
  if (named === 'infinite') return { result: 'infinite', sign: negative ? -1 : 1 }
  if (named === 'nan') return { result: 'nan' }
  if (!hasDecimalMantissa(body)) return { result: 'reject' }
  const value = Number(text)
  if (value === Number.POSITIVE_INFINITY) return { result: 'infinite', sign: 1 }
  if (value === Number.NEGATIVE_INFINITY) return { result: 'infinite', sign: -1 }
  return { result: 'finite', value }
}

/** L3 unit-site entry: the value when finite. The parser site uses the ungated check, so `inf` classifies but never stems. */
export function parseFiniteDecimal(text: string): number | undefined {
  const verdict = parseDecimal(text)
  return verdict.result === 'finite' ? verdict.value : undefined
}

/** L3 parser-site entry: true for any grammar spelling, finite or not. */
export function isDecimalSpelling(text: string): boolean {
  const body = stripOneSign(text)
  if (body.length === 0) return false
  return namedNonFinite(body) !== 'none' || hasDecimalMantissa(body)
}

/** Remove one leading `+` or `-`, if present. */
function stripOneSign(text: string): string {
  const first = text.charCodeAt(0)
  return first === 0x2b || first === 0x2d ? text.slice(1) : text
}

/** ASCII case-insensitive `inf`, `infinity`, or `nan`. */
function namedNonFinite(body: string): 'infinite' | 'nan' | 'none' {
  const lower = asciiLower(body)
  if (lower === 'inf' || lower === 'infinity') return 'infinite'
  if (lower === 'nan') return 'nan'
  return 'none'
}

/** True for `digits[.digits]` or `.digits` with an optional exponent. */
function hasDecimalMantissa(body: string): boolean {
  const scan = { index: 0 }
  let digits = takeDigits(body, scan)
  if (takeByte(body, scan, 0x2e)) digits += takeDigits(body, scan)
  if (digits === 0 || !takeExponent(body, scan)) return false
  return scan.index === body.length
}

/** Consume one ASCII digit run, returning its length. */
function takeDigits(body: string, scan: { index: number }): number {
  const start = scan.index
  while (scan.index < body.length) {
    const code = body.charCodeAt(scan.index)
    if (code < 0x30 || code > 0x39) break
    scan.index += 1
  }
  return scan.index - start
}

/** Consume one expected byte when present. */
function takeByte(body: string, scan: { index: number }, want: number): boolean {
  if (scan.index < body.length && body.charCodeAt(scan.index) === want) {
    scan.index += 1
    return true
  }
  return false
}

/** Consume an optional exponent: true when absent or well-formed. */
function takeExponent(body: string, scan: { index: number }): boolean {
  if (!takeByte(body, scan, 0x65) && !takeByte(body, scan, 0x45)) return true
  if (!takeByte(body, scan, 0x2b)) takeByte(body, scan, 0x2d)
  return takeDigits(body, scan) > 0
}

/**
 * L4 helper: the canonical-magnitude fence. Zero always mints; finite values
 * with `1e-6 <= |v| < 1e21` render; everything else refuses upstream.
 */
export function inCanonicalMagnitude(value: number): boolean {
  return (
    value === 0 ||
    (Math.abs(value) >= MIN_CANONICAL_MAGNITUDE && Math.abs(value) < MAX_CANONICAL_MAGNITUDE)
  )
}

/**
 * L4: shortest round-trip, never exponent, `-0` folds to `0`. Callers fence
 * first; rendering itself is total so goldens stay a pure function.
 */
export function renderDecimal(value: number): string {
  if (value === 0) return '0'
  const plain = String(value)
  return plain.includes('e') || plain.includes('E') ? expandExponent(plain) : plain
}

/** Expand one shortest-round-trip exponent spelling to plain decimal. */
function expandExponent(spelling: string): string {
  const negative = spelling.startsWith('-')
  const body = negative ? spelling.slice(1) : spelling
  const epos = findExponentMark(body)
  const mantissa = body.slice(0, epos)
  const exp = parseExponentInt(body.slice(epos + 1))
  const dot = mantissa.indexOf('.')
  const digits = dot < 0 ? mantissa : mantissa.slice(0, dot) + mantissa.slice(dot + 1)
  const point = (dot < 0 ? mantissa.length : dot) + exp
  const plain =
    point <= 0
      ? '0.' + '0'.repeat(-point) + digits
      : point >= digits.length
        ? digits + '0'.repeat(point - digits.length)
        : digits.slice(0, point) + '.' + digits.slice(point)
  return negative ? '-' + plain : plain
}

/** Offset of the `e`/`E` mark in an exponent spelling. */
function findExponentMark(spelling: string): number {
  const lower = spelling.indexOf('e')
  return lower >= 0 ? lower : spelling.indexOf('E')
}

/** Parse an ASCII `[+-]?digits` exponent over char codes. */
function parseExponentInt(text: string): number {
  let index = 0
  let sign = 1
  const first = text.charCodeAt(0)
  if (first === 0x2b) index = 1
  else if (first === 0x2d) {
    index = 1
    sign = -1
  }
  let value = 0
  while (index < text.length) {
    value = value * 10 + (text.charCodeAt(index) - 0x30)
    index += 1
  }
  return sign * value
}

/**
 * L4 wrapper: fence an `$r` multiplier, collapse near-integers with the 1e-6
 * epsilon, else render. Truncation runs toward zero with saturating i64
 * clamps at the boundary, exactly like `f as i64`. Undefined means the
 * multiplier refuses: non-finite or outside the canonical magnitude.
 */
export function collapseRNumber(factor: number): string | undefined {
  if (!Number.isFinite(factor) || !inCanonicalMagnitude(factor)) return undefined
  const rounded = Math.sign(factor) * Math.round(Math.abs(factor))
  if (Math.abs(factor - rounded) < R_INTEGER_EPSILON) {
    const truncated = Math.trunc(factor)
    if (truncated >= I64_MAX) return '9223372036854775807'
    if (truncated <= I64_MIN) return '-9223372036854775808'
    return String(truncated)
  }
  return renderDecimal(factor)
}

/** L5: ASCII-only lowercase. Non-ASCII passes through unfolded. */
export function asciiLower(text: string): string {
  let out = ''
  for (let index = 0; index < text.length; index += 1) {
    const code = text.charCodeAt(index)
    out += code >= 0x41 && code <= 0x5a ? String.fromCharCode(code + 0x20) : text[index]
  }
  return out
}

/**
 * L6: map exactly space, tab, and newline to `_`; every other char survives,
 * including `\r`, NBSP, and U+0085 left inside quoted substrings.
 */
export function sanitizeValue(val: string): string {
  let out = ''
  for (let index = 0; index < val.length; index += 1) {
    const code = val.charCodeAt(index)
    out += code === 0x20 || code === 0x09 || code === 0x0a ? '_' : val[index]
  }
  return out
}

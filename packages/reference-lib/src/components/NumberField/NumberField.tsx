import * as React from 'react'
import { Div, Input, Button, type PrimitiveProps, type PrimitiveElement } from '@reference-ui/react'
import { setupFocusVisible } from '../../core/theme/primitives/forms/focus-visible'

setupFocusVisible()

// Float-drift cleanup ported verbatim from quarantine (NF-MATH-07/08/14):
// snaps ordinary decimal stepping (0.1 + 0.2) back to the representable
// value only when within float epsilon, and canonicalizes -0 to 0.
function cleanFloat(value: number): number {
  if (!Number.isFinite(value)) return value
  const rounded = parseFloat(value.toPrecision(15))
  if (
    Math.abs(rounded - value) <=
    Math.min(Number.EPSILON * Math.max(1, Math.abs(value)), 1e-10)
  ) {
    return Object.is(rounded, -0) ? 0 : rounded
  }
  return Object.is(value, -0) ? 0 : value
}

// Step-precision rounding ported from React Spectrum's
// react-stately/src/utils/number.ts (roundToStepPrecision): keeps snap math
// on the representable lattice instead of accumulating binary noise.
function roundToStepPrecision(value: number, step: number): number {
  let roundedValue = value
  let precision = 0
  const stepString = step.toString()
  const eIndex = stepString.toLowerCase().indexOf('e-')
  if (eIndex > 0) {
    precision = Math.abs(Math.floor(Math.log10(Math.abs(step)))) + eIndex
  } else {
    const pointIndex = stepString.indexOf('.')
    if (pointIndex >= 0) {
      precision = stepString.length - pointIndex
    }
  }
  if (precision > 0) {
    const pow = Math.pow(10, precision)
    roundedValue = Math.round(roundedValue * pow) / pow
  }
  return roundedValue
}

// NFLAST ruling (a): the TESTS.md freeze lattice, replacing the signed-off
// W-02 RAC math (min-anchored, half-up ties, lattice-clamped max) — re-pinned
// pre-release-cheap per root docs/MISSIONS/DECISIONS.md §3. Zero-anchored nearest lattice
// with away-from-zero midpoint ties; exact/exceeded non-grid bounds are
// preserved as endpoints. Order: endpoint-preservation → nearest-lattice →
// authored rounding (the caller applies displayRoundTrip) → final clamp
// (also the caller, NF-MATH-12).
function snapValueToLattice(value: number, min: number | undefined, max: number | undefined, step: number): number {
  // Endpoint preservation (NF-MATH-10/11): an exact or exceeded bound is
  // returned as-is, never snapped to the lattice.
  if (min !== undefined && value <= min) return min
  if (max !== undefined && value >= max) return max
  // cleanFloat stabilizes float-quotient ties (0.075/0.05 reads
  // 1.4999999999999998) before the tie decision.
  const quotient = cleanFloat(value / step)
  const snappedQuotient = quotient >= 0 ? Math.floor(quotient + 0.5) : Math.ceil(quotient - 0.5)
  return roundToStepPrecision(snappedQuotient * step, step)
}

// Pure zero-lattice membership (NF-MATH-15): off-grid supplied endpoints are
// NOT on-lattice here — the snap branch of ownedInvalid grants them the
// endpoint exception, while validate reports them step-invalid.
function isOnStepLattice(value: number, step: number): boolean {
  const snapped = snapValueToLattice(value, undefined, undefined, step)
  return roundToStepPrecision(snapped - value, step) === 0
}

// Directional lattice stepping (NF-MATH-04/06, freeze decision 6): the next
// lattice point strictly in `direction`, then (factor - 1) further lattice
// steps — Shift+Arrow ≡ 10× Arrow, so off-grid Shift lands where ten single
// steps would (least-surprise interpolation, flagged in DECISIONS.md).
// cleanFloat keeps the strictness exact at float-quotient edges (0.3/0.1).
function stepLatticeInDirection(base: number, direction: 1 | -1, step: number, factor: number): number {
  const quotient = cleanFloat(base / step)
  const edge = direction > 0 ? Math.floor(quotient) + 1 : Math.ceil(quotient) - 1
  return roundToStepPrecision((edge + direction * (factor - 1)) * step, step)
}

// Shallow format-options equality ported from React Spectrum's
// useNumberFieldState: every Intl.NumberFormatOptions member is a primitive,
// so a referentially new but effectively equal object must not reset state.
function isEqualFormatOptions(
  a: Intl.NumberFormatOptions | undefined,
  b: Intl.NumberFormatOptions | undefined
): boolean {
  if (a === b) return true
  if (!a || !b) return false
  const aKeys = Object.keys(a)
  const bKeys = Object.keys(b)
  if (aKeys.length !== bKeys.length) return false
  for (const key of aKeys) {
    if ((b as Record<string, unknown>)[key] !== (a as Record<string, unknown>)[key]) return false
  }
  return true
}

interface DraftNumberSymbols {
  group: string | null
  decimal: string
  // Ten positional glyphs for the resolved numbering system, index = value
  // (NF-PARSE-02/15). Derived from formatToParts, never tabled.
  digits: string
  // Active-locale signs from formatToParts (NF-PARSE-03): fi-FI exposes
  // U+2212 minus while en-US exposes ASCII hyphen-minus.
  minus: string
  plus: string
  // Group pattern from a 10-digit probe (NF-PARSE-17): units = rightmost
  // group size, middle = every inner group size and the head maximum.
  // Western 3-3-3 gives {3,3}; en-IN/hi-IN 3-2-2 gives {3,2}.
  groupSizes: { units: number; middle: number }
  // Configured affixes in locale order (NF-PARSE-08/10/18): exact
  // currency/unit/percent-sign spellings from formatToParts probes across
  // plural values, longest-first. Foreign affixes never appear here.
  affixPrefix: string[]
  affixSuffix: string[]
  // Accounting-currency parens rule (NF-PARSE-12).
  accounting: boolean
  // Localized exponent separator with active digits normalized to ASCII
  // (NF-PARSE-11): "E" most places, "أس" in ar, "×10^" in fa.
  exponentSeparator: string
}

// Hanidec positional glyphs 0-9 (NF-PARSE-02): CJK ideographs are \p{Lo},
// not \p{Nd}, so foreign-digit detection names them explicitly.
const HANIDEC_DIGITS = '〇一二三四五六七八九'

function draftDigits(locale: string, numberingSystem?: string): string {
  const formatter = new Intl.NumberFormat(locale, numberingSystem ? { numberingSystem } : undefined)
  const resolved = formatter.resolvedOptions()
  // NF-PARSE-16: Intl silently drops unusable nu requests (roman → latn),
  // which would be a fallback editor — refuse it explicitly. An explicit
  // numberingSystem option wins over the locale tag, per Intl semantics.
  const localeNu = /-u(?:-[a-z0-9]{2,8})*-nu-([a-z0-9]{3,8})/i.exec(locale)?.[1]?.toLowerCase()
  const requestedNu = numberingSystem ?? localeNu
  if (requestedNu && resolved.numberingSystem !== requestedNu) {
    throw new Error(
      `Reference UI: NumberField "locale" requests numbering system "${requestedNu}" but Intl resolves "${resolved.numberingSystem}" — "${locale}" is not editable.`
    )
  }
  let digits = ''
  for (let value = 0; value <= 9; value += 1) {
    const integer = formatter.formatToParts(value).find(part => part.type === 'integer')?.value ?? ''
    // NF-PARSE-16: algorithmic or non-invertible systems fail before
    // accepting edits — no fallback editor, no silent ASCII.
    if (Array.from(integer).length !== 1 || digits.includes(integer)) {
      throw new Error(
        `Reference UI: NumberField "locale" resolves to a numbering system without ten stable positional digits — "${locale}" is not editable.`
      )
    }
    digits += integer
  }
  return digits
}

function draftNumberSymbols(locale: string, formatOptions?: Intl.NumberFormatOptions): DraftNumberSymbols {
  const parts = new Intl.NumberFormat(locale).formatToParts(1234567.89)
  const numberingSystem = formatOptions?.numberingSystem
  const formatter = new Intl.NumberFormat(locale, numberingSystem ? { numberingSystem } : undefined)
  const display = new Intl.NumberFormat(locale, formatOptions)
  const resolvedDisplay = display.resolvedOptions()
  const affixes = draftAffixes(display, resolvedDisplay.style)
  const digits = draftDigits(locale, numberingSystem)
  const rawSeparator =
    new Intl.NumberFormat(locale, { notation: 'scientific' })
      .formatToParts(12345)
      .find(part => part.type === 'exponentSeparator')?.value ?? 'E'
  return {
    group: parts.find(part => part.type === 'group')?.value ?? null,
    decimal: parts.find(part => part.type === 'decimal')?.value ?? '.',
    digits,
    minus:
      formatter.formatToParts(-1).find(part => part.type === 'minusSign')?.value ?? '-',
    plus:
      new Intl.NumberFormat(locale, { signDisplay: 'exceptZero' })
        .formatToParts(1)
        .find(part => part.type === 'plusSign')?.value ?? '+',
    groupSizes: draftGroupSizes(locale),
    affixPrefix: affixes.prefix,
    affixSuffix: affixes.suffix,
    accounting: resolvedDisplay.style === 'currency' && resolvedDisplay.currencySign === 'accounting',
    exponentSeparator: normalizeDraftDigits(rawSeparator, digits) ?? 'E',
  }
}

// Values exposing every plural affix category (NF-PARSE-18): singular,
// dual, few, many, plus grouped magnitudes. Liters (unit "liter") vary
// more; currency names inflect in fr/ru/ar.
const DRAFT_AFFIX_PROBE_VALUES = [0, 1, 2, 3, 5, 11, 100, 1234.5]

// Permille marks (NF-PARSE-09): Intl never emits them, but percent style
// scales U+2030 (and the Arabic-indic U+0609) by 1/1000 per React Aria.
const DRAFT_PERMILLE_MARKS = ['\u2030', '\u0609']

function draftAffixes(
  display: Intl.NumberFormat,
  style: string | undefined
): { prefix: string[]; suffix: string[] } {
  const prefix = new Set<string>()
  const suffix = new Set<string>()
  if (style === 'decimal') return { prefix: [], suffix: [] }
  for (const value of DRAFT_AFFIX_PROBE_VALUES) {
    const parts = display.formatToParts(value)
    const firstNumeric = parts.findIndex(
      part => part.type === 'integer' || part.type === 'decimal' || part.type === 'fraction'
    )
    parts.forEach((part, index) => {
      if (part.type !== 'currency' && part.type !== 'unit' && part.type !== 'percentSign') return
      if (firstNumeric === -1 || index < firstNumeric) prefix.add(part.value)
      else suffix.add(part.value)
    })
  }
  if (style === 'percent') {
    for (const mark of DRAFT_PERMILLE_MARKS) suffix.add(mark)
  }
  const longestFirst = (a: string, b: string) => b.length - a.length
  return {
    prefix: Array.from(prefix).sort(longestFirst),
    suffix: Array.from(suffix).sort(longestFirst),
  }
}

function draftGroupSizes(locale: string): { units: number; middle: number } {
  const segments: string[] = ['']
  for (const part of new Intl.NumberFormat(locale).formatToParts(1234567890)) {
    if (part.type === 'group') segments.push('')
    else if (part.type === 'integer') segments[segments.length - 1] += part.value
  }
  // A 10-digit probe always groups in supported locales; fall back to
  // western 3-3 if a locale ever renders it ungrouped.
  if (segments.length < 3) return { units: 3, middle: 3 }
  return {
    units: Array.from(segments[segments.length - 1]).length,
    middle: Array.from(segments[segments.length - 2]).length,
  }
}

// Documented width variants (NF-PARSE-03, DECISIONS.md): fullwidth and
// small-form signs parse globally. Figure/en/em dashes are sign-like
// punctuation, never signs — they die at Number(), never normalize.
const DRAFT_PLUS_VARIANTS = ['＋', '﹢']
const DRAFT_MINUS_VARIANTS = ['－', '﹣']

// Logical caret digit (NF-EDIT-07): ASCII plus the active numbering-system
// glyphs — the same digit class the parser accepts. Hanidec/foreign digits
// never render here, so they count as separators, never caret anchors.
function isLogicalDigitChar(char: string, digits: string): boolean {
  if (char >= '0' && char <= '9') return true
  return digits.includes(char)
}

// Caret offset after the count-th logical digit of text (NF-EDIT-07): the
// caret follows its digits across formatting replacements. A caret with no
// preceding digit anchors to text start; a count the new text cannot
// satisfy clamps to the end (documented end fallback).
function offsetAfterLogicalDigits(text: string, count: number, digits: string): number {
  if (count <= 0) return 0
  let seen = 0
  let offset = 0
  for (const char of Array.from(text)) {
    offset += char.length
    if (isLogicalDigitChar(char, digits)) {
      seen += 1
      if (seen === count) return offset
    }
  }
  return text.length
}

// Digit normalization (NF-PARSE-02/15): ASCII always parses; active-system
// glyphs map to their positional value; any other decimal digit — a second
// non-ASCII script or inactive-locale digits — rejects the whole text.
function normalizeDraftDigits(text: string, digits: string): string | null {
  let normalized = ''
  for (const char of text) {
    if (char >= '0' && char <= '9') {
      normalized += char
      continue
    }
    // ASCII was claimed above, so any active-set hit here is non-ASCII.
    const active = digits.indexOf(char)
    if (active >= 0) {
      normalized += String(active)
      continue
    }
    if (HANIDEC_DIGITS.includes(char) || /\p{Nd}/u.test(char)) return null
    normalized += char
  }
  return normalized
}

// Formatter-inserted bidi controls (NF-PARSE-13): LRM/RLM/ALM appear at
// edges AND embedded (ar negatives, he-IL currency), so they are removed
// globally before parsing. Every other invisible (ZWSP/ZWNJ/ZWJ, word
// joiner, controls) stays literal and dies at Number(). Currency/percent/
// unit marks are NOT stripped: only configured affixes parse
// (NF-PARSE-08/09/10); foreign marks stay literal and die at Number().
const DRAFT_BIDI_GLOBAL = /[\u200E\u200F\u061C]/gu
const DRAFT_ASCII_DIGITS = /^[0-9]+$/

// Localized exponent extraction (NF-PARSE-11): the active separator wins,
// ASCII e/E always parse. The exponent takes one sign from the full
// NF-PARSE-03 set plus ASCII digits (already normalized); anything else
// leaves the separator in the core, where Number() rejects it.
function stripDraftExponent(
  core: string,
  symbols: DraftNumberSymbols
): { head: string; exponent: string } | null {
  const separators = [symbols.exponentSeparator, 'e', 'E'].filter(
    (candidate, index, all) => candidate !== '' && all.indexOf(candidate) === index
  )
  const signs = [
    symbols.plus,
    symbols.minus,
    ...DRAFT_PLUS_VARIANTS,
    ...DRAFT_MINUS_VARIANTS,
    '+',
    '-',
  ]
    .filter((candidate, index, all) => candidate !== '' && all.indexOf(candidate) === index)
    .sort((a, b) => b.length - a.length)
  for (const separator of separators) {
    const index = core.lastIndexOf(separator)
    if (index <= 0) continue
    let rest = core.slice(index + separator.length)
    let sign = ''
    const signMatch = signs.find(candidate => rest.startsWith(candidate))
    if (signMatch !== undefined) {
      const isPlus =
        signMatch === '+' ||
        signMatch === symbols.plus ||
        DRAFT_PLUS_VARIANTS.includes(signMatch)
      sign = isPlus ? '+' : '-'
      rest = rest.slice(signMatch.length)
    }
    if (!DRAFT_ASCII_DIGITS.test(rest)) continue
    return { head: core.slice(0, index), exponent: `e${sign}${rest}` }
  }
  return null
}

function isValidGroupHead(segments: string[], sizes: { units: number; middle: number }): boolean {
  // Locale-pattern grouping (NF-PARSE-05/17): the head holds 1..middle
  // digits, inner groups exactly middle, the units group exactly units.
  // Foreign punctuation ("2.5" under de-DE) and cross-pattern groups
  // ("1,234,567" under en-IN) are rejected, never reinterpreted.
  if (segments.length === 1) return true
  if (!DRAFT_ASCII_DIGITS.test(segments[0]) || segments[0].length > sizes.middle) return false
  for (let index = 1; index < segments.length - 1; index += 1) {
    if (!DRAFT_ASCII_DIGITS.test(segments[index]) || segments[index].length !== sizes.middle) {
      return false
    }
  }
  const units = segments[segments.length - 1]
  return DRAFT_ASCII_DIGITS.test(units) && units.length === sizes.units
}

// W-25 commit parser: ASCII + active-numbering-system digits (NF-PARSE-02),
// configured currency/unit/percent affixes in locale order (NF-PARSE-08),
// locale group/decimal normalization, a single leading sign, and an
// optional ASCII exponent. Percent style scales the result (1/100, 1/1000
// for permille) per React Aria's parser. Returns NaN for anything else:
// foreign digits/affixes/punctuation, hex-able prefixes are still honored
// via Number(), or nonfinite results.
function stripDraftAffix(core: string, affixes: string[], atStart: boolean): string | null {
  const match = affixes.find(affix => (atStart ? core.startsWith(affix) : core.endsWith(affix)))
  if (match === undefined) return null
  return atStart ? core.slice(match.length) : core.slice(0, core.length - match.length)
}

// Programmatic value write that React's change tracker still treats as
// a user edit: writing through the prototype setter (not the instance
// property React wraps) keeps a following synthetic input event real.
function setNativeInputValue(node: HTMLInputElement, text: string): void {
  const descriptor = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(node), 'value')
  if (descriptor?.set) {
    descriptor.set.call(node, text)
  } else {
    node.value = text
  }
}

// NF-EDIT-02 tendency gate: a typed insertion is impossible (canceled)
// iff the typed text introduces a letter other than one well-placed
// exponent e/E, a duplicate decimal separator, or a second/misplaced
// sign. Digits, group separators, and valid partials always stage.
function isImpossibleInsertion(
  current: string,
  start: number,
  end: number,
  data: string,
  symbols: DraftNumberSymbols
): boolean {
  if (data === '') return false
  const spliced = current.slice(0, start) + data + current.slice(end)
  // Letters: exactly one e/E after a mantissa char passes (partial
  // exponent "1e"); a leading, doubled, or non-exponent letter cancels.
  const exponentParts = spliced.split(/[eE]/)
  const withoutExponent =
    exponentParts.length === 2 && exponentParts[0] !== '' ? data.replace(/[eE]/, '') : data
  if (/\p{L}/u.test(withoutExponent)) return true
  // Duplicate decimal: the insertion adds the separator while the
  // splice would already hold one.
  if (data.includes(symbols.decimal) && spliced.split(symbols.decimal).length > 2) return true
  // Second/misplaced sign: the insertion adds sign text while the
  // splice would hold more than one sign or a non-leading one.
  const spellings = Array.from(
    new Set(['+', '-', symbols.plus, symbols.minus, ...DRAFT_PLUS_VARIANTS, ...DRAFT_MINUS_VARIANTS])
  )
  if (spellings.some(spelling => data.includes(spelling))) {
    const count = spellings.reduce(
      (total, spelling) => total + (spliced.split(spelling).length - 1),
      0
    )
    const leading = spellings.some(spelling => spliced.startsWith(spelling))
    if (count > 1 || (count === 1 && !leading)) return true
  }
  return false
}

function startsWithDraftSign(core: string, symbols: DraftNumberSymbols): boolean {
  if (core.startsWith('+') || core.startsWith('-')) return true
  if (symbols.plus !== '+' && core.startsWith(symbols.plus)) return true
  if (symbols.minus !== '-' && core.startsWith(symbols.minus)) return true
  return (
    DRAFT_PLUS_VARIANTS.some(variant => core.startsWith(variant)) ||
    DRAFT_MINUS_VARIANTS.some(variant => core.startsWith(variant))
  )
}

function parseDraftNumber(
  text: string,
  symbols: DraftNumberSymbols,
  percentStyle: boolean,
  options?: { allowOrphanHead?: boolean }
): number {
  // NF-PARSE-13: formatter bidi controls vanish everywhere first.
  const clean = text.replace(DRAFT_BIDI_GLOBAL, '')
  // NF-PARSE-06: arbitrary leading whitespace rejects (whitespace-only
  // text never reaches the parser — the empty path claims it first).
  if (clean.trim() !== '' && /^\s/.test(clean)) return NaN
  const stripped = clean.trim()
  if (stripped === '') return NaN
  // NF-PARSE-12: accounting parens mean exactly one minus, and only in
  // accounting currency — unsigned paren-free inside, or the whole text
  // rejects (never silent sign-stripping, never double negation).
  if (symbols.accounting && stripped.startsWith('(') && stripped.endsWith(')') && stripped.length > 2) {
    const inner = stripped.slice(1, stripped.length - 1)
    if (inner.includes('(') || inner.includes(')') || startsWithDraftSign(inner, symbols)) return NaN
    const innerParsed = parseDraftNumber(inner, symbols, percentStyle)
    return Number.isNaN(innerParsed) ? NaN : -innerParsed
  }
  // Configured affixes strip before signs (NF-PARSE-08/10): one suffix,
  // one prefix, then — only past a consumed sign — one more prefix, so
  // "-$5" and "$-5" both parse while "$$5" and "++5" still reject.
  let affixed = stripped
  const removed: string[] = []
  const suffixStripped = stripDraftAffix(affixed, symbols.affixSuffix, false)
  if (suffixStripped !== null) {
    removed.push(affixed.slice(suffixStripped.length))
    affixed = suffixStripped
  }
  const prefixStripped = stripDraftAffix(affixed, symbols.affixPrefix, true)
  if (prefixStripped !== null) {
    removed.push(affixed.slice(0, affixed.length - prefixStripped.length))
    affixed = prefixStripped
  }

  // NF-PARSE-03: one leading sign — ASCII, the active-locale sign, or a
  // documented width variant. Anything else sign-like stays literal and
  // dies at Number() (never normalized globally).
  let core = affixed
  let sign = ''
  const leadingVariant = (variants: string[]) => variants.find(variant => core.startsWith(variant))
  if (core.startsWith('+') || core.startsWith('-')) {
    sign = core.slice(0, 1)
    core = core.slice(1)
  } else if (symbols.plus !== '+' && core.startsWith(symbols.plus)) {
    sign = '+'
    core = core.slice(symbols.plus.length)
  } else if (symbols.minus !== '-' && core.startsWith(symbols.minus)) {
    sign = '-'
    core = core.slice(symbols.minus.length)
  } else {
    const plusVariant = leadingVariant(DRAFT_PLUS_VARIANTS)
    const minusVariant = plusVariant === undefined ? leadingVariant(DRAFT_MINUS_VARIANTS) : undefined
    if (plusVariant !== undefined) {
      sign = '+'
      core = core.slice(plusVariant.length)
    } else if (minusVariant !== undefined) {
      sign = '-'
      core = core.slice(minusVariant.length)
    }
  }
  if (sign !== '') {
    const innerPrefix = stripDraftAffix(core, symbols.affixPrefix, true)
    if (innerPrefix !== null) {
      removed.push(core.slice(0, core.length - innerPrefix.length))
      core = innerPrefix
    }
  }
  const digitNormalized = normalizeDraftDigits(core.trim(), symbols.digits)
  if (digitNormalized === null) return NaN
  core = digitNormalized
  let exponent = ''
  const exponentStripped = stripDraftExponent(core, symbols)
  if (exponentStripped !== null) {
    exponent = exponentStripped.exponent
    core = exponentStripped.head
  }
  // A second sign outside the exponent is never valid ("++5", "5-3") —
  // duplicates and embedded signs reject, never discard (NF-PARSE-03).
  if (core.includes('+') || core.includes('-')) return NaN
  const embeddedSigns = [
    symbols.plus,
    symbols.minus,
    ...DRAFT_PLUS_VARIANTS,
    ...DRAFT_MINUS_VARIANTS,
  ]
  const hasEmbeddedSign = embeddedSigns.some(
    candidate => candidate !== '+' && candidate !== '-' && core.includes(candidate)
  )
  if (hasEmbeddedSign) return NaN

  let head = core
  let tail: string | null = null
  const decimalIndex = core.indexOf(symbols.decimal)
  if (decimalIndex >= 0) {
    head = core.slice(0, decimalIndex)
    tail = core.slice(decimalIndex + symbols.decimal.length)
    // A trailing decimal ("1.") is incomplete grammar, never a commitable
    // number (NF-PARSE-04): it stays dirty and reverts at the boundary.
    if (tail === '') return NaN
    // One decimal separator only; group separators never follow it.
    if (tail.includes(symbols.decimal)) return NaN
    if (symbols.group !== null && tail.includes(symbols.group)) return NaN
  }
  // Space-group locales (fr-FR) accept keyboard spaces as the group
  // separator — the Intl narrow-NBSP exists on no keyboard. Position
  // validation still applies, so "1 2" stays invalid.
  if (symbols.group !== null && /^\s$/.test(symbols.group)) {
    head = head.replace(/[\u0020\u00A0\u2000-\u200A\u202F\u205F\u3000]/g, symbols.group)
  }
  // Apostrophe-group locales (de-CH) accept the typographic right quote
  // as the keyboard straight quote (NF-PARSE-06) — same rationale.
  if (symbols.group === "'") {
    head = head.replace(/’/g, "'")
  }
  // NF-EDIT-15: a single leading orphan group separator (first-digit
  // deletion: ",024") is discarded at commit when the remainder is
  // unambiguous. Live parsing stays strict, so the orphan partial never
  // publishes mid-edit.
  if (options?.allowOrphanHead === true && symbols.group !== null && head.startsWith(symbols.group)) {
    head = head.slice(symbols.group.length)
  }
  let headDigits = head
  if (symbols.group !== null && head.includes(symbols.group)) {
    const segments = head.split(symbols.group)
    if (!isValidGroupHead(segments, symbols.groupSizes)) return NaN
    headDigits = segments.join('')
  }
  if (headDigits === '' && (tail === null || tail === '') && exponent === '') return NaN
  const normalized = sign + headDigits + (tail === null ? '' : `.${tail}`) + exponent
  const parsed = Number(normalized)
  if (!Number.isFinite(parsed)) return NaN
  if (!percentStyle) return parsed
  const hasPermille = removed.some(mark => DRAFT_PERMILLE_MARKS.includes(mark))
  return hasPermille ? parsed / 1000 : parsed / 100
}

// W-02 commit policy as ruled (docs/archive/FINISH.md captain rulings adopting NFLAST
// (a)(b)): 'snap' commits via the zero-anchored lattice with endpoint
// preservation (order endpoint→lattice→rounding→final clamp); 'validate'
// retains finite under/over/off-step candidates (requests the rounded raw
// candidate, managed invalid state blocks submit) with advisory
// onInvalidCommit alongside onChange; 'none' clamps at commit, never snaps,
// and owns no invalid state. Prop name and snap/validate pair mirror React
// Aria NumberField verbatim; the default ('none') and third value are ours
// (docs/MISSIONS/WANTS.md W-02).
export type NumberFieldCommitBehavior = 'snap' | 'validate' | 'none'

export type NumberFieldInvalidCommitReason = 'off-step' | 'out-of-range'

export type NumberFieldProps = Omit<PrimitiveProps<'div'>, 'onChange' | 'value' | 'defaultValue'> & {
  value: number | null
  onChange?: (value: number | null) => void
  locale: string
  min?: number
  max?: number
  step?: number
  disabled?: boolean
  // PATCHES §5: interaction/form state. readOnly suppresses stepping and
  // numeric submit blocking while still serializing canonical state;
  // required keeps native valueMissing; invalid is an ARIA/style signal
  // that never blocks submit by itself; name/form own the hidden input.
  readOnly?: boolean
  required?: boolean
  invalid?: boolean
  name?: string
  form?: string
  // W-25: Intl display formatting. The committed value stays a plain
  // number; only the clean (non-editing) rendering is formatted.
  formatOptions?: Intl.NumberFormatOptions
  commitBehavior?: NumberFieldCommitBehavior
  onInvalidCommit?: (attempted: number, reason: NumberFieldInvalidCommitReason) => void
}

interface NumberFieldContextValue {
  value: number | null
  // W-25: clean-state rendered text (Intl formatting of the controlled
  // value). The Input shows the verbatim draft while dirty, this otherwise.
  displayValue: string
  min?: number
  max?: number
  step: number
  disabled: boolean
  readOnly: boolean
  required: boolean
  // Managed invalid union: application invalid, owned numeric-constraint
  // state, or a retained failed boundary. Only the latter two block submit.
  invalid: boolean
  inputMode: 'text' | 'decimal' | 'numeric'
  // Stable Input identity: explicit Input id wins, else a pinned useId.
  // Steppers read the same value for aria-controls (same-commit retarget).
  inputId: string
  // Transient edit buffer (B-19 dirty session + NFLAST ruling (c)
  // live-request); null means clean (input shows formatted controlled
  // value). Typing stages the verbatim draft and requests newly parseable
  // meanings live; commit boundaries (blur, Enter, step actions) flush.
  draft: string | null
  // Complete dirty candidate (parseable, clamped once) or null; steppers
  // and keys use it as their base, falling back to controlled value.
  stepBase: number | null
  // Form reset generation: steppers end active holds when it advances.
  resetEpoch: number
  // NF-DYNAMIC-05 replacement generation: non-echo value/locale/format
  // swaps advance it; steppers end active holds when it advances.
  replacementEpoch: number
  increment: (factor?: number) => void
  decrement: (factor?: number) => void
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  handleCompositionStart: () => void
  handleCompositionEnd: () => void
  handleKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void
  commitDraft: () => void
  inputRef: React.RefObject<HTMLInputElement | null>
  focusInput: () => void
}

const NumberFieldContext = React.createContext<NumberFieldContextValue | null>(null)

// Group membership scope (PATCHES §4): present only inside a Group. Named
// parts throw a part-specific diagnostic when it is absent (misplaced
// outside any Group); the registry counts catch nested extras that the
// direct-children scan cannot see.
type NumberFieldPartKind = 'input' | 'increment' | 'decrement'

interface NumberFieldGroupScopeValue {
  registerPart: (kind: NumberFieldPartKind) => () => void
}

const NumberFieldGroupContext = React.createContext<NumberFieldGroupScopeValue | null>(null)

// NF-TYPE-03: behavior-owned Input props, absent from the public part type
// and stripped again at runtime so conflicting casts cannot land.
export type NumberFieldManagedInputProp =
  | 'type'
  | 'role'
  | 'value'
  | 'defaultValue'
  | 'inputMode'
  | 'name'
  | 'form'
  | 'min'
  | 'max'
  | 'step'
  | 'disabled'
  | 'readOnly'
  | 'required'
  | 'aria-disabled'
  | 'aria-readonly'
  | 'aria-required'
  | 'aria-invalid'
  | 'aria-valuemin'
  | 'aria-valuemax'
  | 'aria-valuenow'
  | 'aria-valuetext'

export type NumberFieldInputProps = Omit<PrimitiveProps<'input'>, NumberFieldManagedInputProp>

// NF-TYPE-03: Group owns role, aria-disabled, and aria-invalid;
// aria-readonly/aria-required are always absent (unsupported on group —
// data-readonly/data-required carry styling instead). status is Field's
// visual exception and never implies invalid.
export type NumberFieldGroupProps = Omit<
  PrimitiveProps<'div'>,
  'role' | 'aria-disabled' | 'aria-readonly' | 'aria-required' | 'aria-invalid'
> & {
  status?: 'warning'
}

function isNumberFieldPart(
  node: React.ReactNode,
  part: unknown
): node is React.ReactElement<Record<string, unknown>> {
  return React.isValidElement(node) && node.type === part
}

export const NumberFieldGroup = React.forwardRef<HTMLDivElement, NumberFieldGroupProps>(
  function NumberFieldGroup(
    {
      children,
      status,
      className,
      style,
      onFocus: userOnFocus,
      onBlur: userOnBlur,
      ...props
    },
    ref
  ) {
    const context = React.useContext(NumberFieldContext)
    if (!context) {
      throw new Error(
        'Reference UI: NumberField.Group must be a direct child of <NumberField> — it has no behavior outside the field.'
      )
    }

    // Direct-anatomy validation (NF-DOM-03, render phase so SSR fails fast
    // too): exactly one direct Input, at most one of each stepper. Arbitrary
    // non-part siblings pass through untouched (NF-DOM-04).
    const kids = React.Children.toArray(children)
    const directInputCount = kids.filter(kid => isNumberFieldPart(kid, NumberFieldInput)).length
    if (directInputCount === 0) {
      throw new Error(
        'Reference UI: NumberField.Group requires exactly one direct <NumberField.Input> — none was found; only named parts join behavior.'
      )
    }
    if (directInputCount > 1) {
      throw new Error(
        `Reference UI: NumberField.Group requires exactly one direct <NumberField.Input> but found ${directInputCount} — no DOM-order authority is chosen.`
      )
    }
    const directIncCount = kids.filter(kid => isNumberFieldPart(kid, NumberFieldIncrement)).length
    if (directIncCount > 1) {
      throw new Error(
        `Reference UI: NumberField.Group accepts at most one direct <NumberField.Increment> but found ${directIncCount} — no DOM-order authority is chosen.`
      )
    }
    const directDecCount = kids.filter(kid => isNumberFieldPart(kid, NumberFieldDecrement)).length
    if (directDecCount > 1) {
      throw new Error(
        `Reference UI: NumberField.Group accepts at most one direct <NumberField.Decrement> but found ${directDecCount} — no DOM-order authority is chosen.`
      )
    }

    // Nested-extra registry: parts register in layout effects, which run
    // bottom-up, so this Group check observes the settled counts. Unnamed
    // steppers render nothing and never register; unnamed Input still does.
    const registryRef = React.useRef({ input: 0, increment: 0, decrement: 0 })
    const registerPart = React.useCallback((kind: NumberFieldPartKind) => {
      registryRef.current[kind] += 1
      return () => {
        registryRef.current[kind] -= 1
      }
    }, [])
    const scopeValue = React.useMemo<NumberFieldGroupScopeValue>(
      () => ({ registerPart }),
      [registerPart]
    )
    useIsomorphicLayoutEffect(() => {
      const counts = registryRef.current
      if (counts.input > 1 || counts.increment > 1 || counts.decrement > 1) {
        throw new Error(
          'Reference UI: NumberField.Group found duplicate named parts nested inside non-part siblings — named parts must be direct children of the Group.'
        )
      }
    })

    // data-focused tracks the single Input tab stop (NF-A11Y-05):
    // pointer-focus sets it, blur clears it. data-focus-visible is owned
    // by the shared interaction kernel via the marker (TESTS "Owned
    // elsewhere"); a forged static attribute is stripped once on mount.
    const groupRef = React.useRef<HTMLDivElement | null>(null)
    const [focused, setFocused] = React.useState(false)
    useIsomorphicLayoutEffect(() => {
      groupRef.current?.removeAttribute('data-focus-visible')
    }, [])
    const setGroupRef = React.useCallback(
      (node: HTMLDivElement | null) => {
        groupRef.current = node
        if (typeof ref === 'function') {
          ref(node)
        } else if (ref) {
          ;(ref as React.MutableRefObject<HTMLDivElement | null>).current = node
        }
      },
      [ref]
    )
    const inputRef = context.inputRef
    const onFocus = (e: React.FocusEvent<HTMLDivElement>) => {
      userOnFocus?.(e)
      if (e.target === inputRef.current) setFocused(true)
    }
    const onBlur = (e: React.FocusEvent<HTMLDivElement>) => {
      userOnBlur?.(e)
      if (e.target === inputRef.current) setFocused(false)
    }

    const { value, disabled, readOnly, required, invalid, draft } = context
    const empty = draft !== null ? draft === '' : value === null

    // Managed authority (NF-DOM-06): behavior-owned props are stripped so
    // conflicting runtime casts cannot break the field; data-status comes
    // only from status="warning". Unrelated props pass through (NF-DOM-05).
    const {
      role: _managedRole,
      'aria-disabled': _managedAriaDisabled,
      'aria-readonly': _managedAriaReadonly,
      'aria-required': _managedAriaRequired,
      'aria-invalid': _managedAriaInvalid,
      ...restProps
    } = props as Record<string, unknown>

    return (
      <NumberFieldGroupContext.Provider value={scopeValue}>
        <Div
          ref={setGroupRef}
          {...restProps}
          role="group"
          data-reference-field=""
          data-reference-number-field=""
          aria-disabled={disabled ? 'true' : undefined}
          aria-invalid={invalid ? 'true' : undefined}
          data-disabled={disabled ? '' : undefined}
          data-readonly={readOnly ? '' : undefined}
          data-required={required ? '' : undefined}
          data-invalid={invalid ? '' : undefined}
          data-empty={empty ? '' : undefined}
          data-editing={draft !== null ? '' : undefined}
          data-focused={focused ? '' : undefined}
          data-status={status === 'warning' ? 'warning' : undefined}
          onFocus={onFocus}
          onBlur={onBlur}
          className={className}
          style={style}
        >
          {children}
        </Div>
      </NumberFieldGroupContext.Provider>
    )
  }
)

export const NumberFieldInput = React.forwardRef<HTMLInputElement, NumberFieldInputProps>(
  function NumberFieldInput(
    {
      className,
      style,
      onKeyDown: userOnKeyDown,
      onChange: userOnChange,
      onCompositionStart: userOnCompositionStart,
      onCompositionEnd: userOnCompositionEnd,
      onFocus: userOnFocus,
      onBlur: userOnBlur,
      autoComplete: authoredAutoComplete,
      autoCorrect: authoredAutoCorrect,
      spellCheck: authoredSpellCheck,
      'aria-label': ariaLabel,
      'aria-labelledby': ariaLabelledby,
      ...props
    },
    ref
  ) {
    const context = React.useContext(NumberFieldContext)
    if (!context) {
      throw new Error(
        'Reference UI: NumberField.Input must be used inside <NumberField> — it has no behavior outside the field.'
      )
    }
    const groupScope = React.useContext(NumberFieldGroupContext)
    if (!groupScope) {
      throw new Error(
        'Reference UI: NumberField.Input must be a direct child of <NumberField.Group> — misplaced parts never join behavior.'
      )
    }

    const {
      value,
      displayValue,
      disabled,
      readOnly,
      required,
      invalid,
      inputMode,
      inputId,
      draft,
      handleInputChange,
      handleCompositionStart,
      handleCompositionEnd,
      handleKeyDown,
      commitDraft,
      inputRef,
    } = context
    const empty = draft !== null ? draft === '' : value === null

    // Named-part registration (NF-DOM-03): the Group counts registrations
    // to catch nested extras. Unnamed Input still renders and registers —
    // only the missing name diagnoses (NF-A11Y-02).
    const registerPart = groupScope.registerPart
    useIsomorphicLayoutEffect(() => registerPart('input'), [registerPart])

    // Unnamed Input diagnoses without inventing label markup (NF-A11Y-02):
    // naming stays the application's job (label, aria-label, labelledby).
    // Targets only exist in committed DOM, so labelledby resolution runs in
    // a layout effect like the stepper gate. Associated <label> elements
    // (htmlFor or wrapping) count as names — only the truly unnamed log.
    const unnamedLoggedRef = React.useRef(false)
    useIsomorphicLayoutEffect(() => {
      const labelValid = stepperNameText(ariaLabel).trim() !== ''
      const labelledbyText = stepperNameText(ariaLabelledby)
      const ids = stepperNameIds(labelledbyText)
      let named = labelValid
      // NF-ENV-06: name resolution stays in the owner root (open
      // ShadowRoot included) — never document-global.
      const root =
        (inputRef.current?.getRootNode() as Document | ShadowRoot | undefined) ??
        (typeof document !== 'undefined' ? document : undefined)
      if (!named && root !== undefined) {
        const node = inputRef.current
        const forLabel = root.querySelector(`label[for="${inputId}"]`)
        if (forLabel && (forLabel.textContent ?? '').trim() !== '') {
          named = true
        } else if (node?.closest('label') && (node.closest('label')?.textContent ?? '').trim() !== '') {
          named = true
        }
      }
      if (!named && ids.length > 0 && root !== undefined) {
        const name = ids
          .map(id => {
            const el = root.getElementById(id)
            return el === null ? '' : el.getAttribute('aria-label') || el.textContent || ''
          })
          .join(' ')
        named = name.trim() !== ''
      }
      if (named) {
        unnamedLoggedRef.current = false
        return
      }
      if (unnamedLoggedRef.current) return
      unnamedLoggedRef.current = true
      numberFieldDevDiagnostic(
        'Input has no accessible name — associate a <label>, aria-label, or aria-labelledby; no label markup was invented.'
      )
    }, [ariaLabel, ariaLabelledby, inputId, inputRef])

    // Managed authority (NF-TYPE-03, NF-DOM-06): behavior-owned props are
    // stripped so conflicting consumer casts cannot break the field.
    // B-26 / SPEC: Input keeps plain textbox semantics — no role recast,
    // no numeric aria-value* — so stripping also enforces their absence.
    // Input alone carries native readOnly/required; Group never renders
    // aria-readonly/aria-required. The authored id is consumed by the root
    // scan (explicit-ID priority) and stripped here so an explicit
    // undefined cannot erase the resolved context id downstream.
    // Unrelated props (aria-label, data-* descriptions, placeholder) pass
    // through untouched (NF-DOM-05).
    const {
      id: _explicitId,
      type: _managedType,
      role: _managedRole,
      value: _managedValue,
      defaultValue: _managedDefaultValue,
      inputMode: _managedInputMode,
      name: _managedName,
      form: _managedForm,
      min: _managedMin,
      max: _managedMax,
      step: _managedStep,
      disabled: _managedDisabled,
      readOnly: _managedReadOnly,
      required: _managedRequired,
      'aria-disabled': _managedAriaDisabled,
      'aria-readonly': _managedAriaReadonly,
      'aria-required': _managedAriaRequired,
      'aria-invalid': _managedAriaInvalid,
      'aria-valuenow': _managedNow,
      'aria-valuemin': _managedMinAttr,
      'aria-valuemax': _managedMaxAttr,
      'aria-valuetext': _managedText,
      ...restProps
    } = props as Record<string, unknown>

    const setInputRef = React.useCallback(
      (node: HTMLInputElement | null) => {
        if (inputRef) {
          ;(inputRef as React.MutableRefObject<HTMLInputElement | null>).current = node
        }
        if (typeof ref === 'function') {
          ref(node)
        } else if (ref) {
          ;(ref as React.MutableRefObject<HTMLInputElement | null>).current = node
        }
      },
      [ref, inputRef]
    )

    const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      userOnKeyDown?.(e)
      if (!e.defaultPrevented) {
        handleKeyDown(e)
      }
    }

    // Consumer edit handlers run first in native order; cancellation at the
    // cancelable boundary suppresses managed work (NF-EDIT-13, NF-KEY-07).
    const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      userOnChange?.(e)
      if (!e.defaultPrevented) {
        handleInputChange(e)
      }
    }

    // NF-EDIT-11: consumer composition observers run first; the managed
    // session flag always tracks the native session (no veto exists).
    const onCompositionStart = (e: React.CompositionEvent<HTMLInputElement>) => {
      userOnCompositionStart?.(e)
      handleCompositionStart()
    }
    const onCompositionEnd = (e: React.CompositionEvent<HTMLInputElement>) => {
      userOnCompositionEnd?.(e)
      handleCompositionEnd()
    }

    // A vetoed blur keeps the dirty session and its selection while
    // unfocused (NF-COMMIT-10); refocus restores the exact selection.
    const vetoedSelectionRef = React.useRef<{ start: number; end: number } | null>(null)
    const onFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      userOnFocus?.(e)
      const vetoed = vetoedSelectionRef.current
      vetoedSelectionRef.current = null
      if (vetoed && draft !== null) {
        try {
          e.currentTarget.setSelectionRange(vetoed.start, vetoed.end)
        } catch {
          // ignore if not supported
        }
      }
    }

    // Blur is a commit boundary: the consumer observes first and can veto
    // the commit with preventDefault, leaving the dirty buffer intact.
    const onBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      userOnBlur?.(e)
      if (e.defaultPrevented) {
        try {
          vetoedSelectionRef.current = {
            start: e.currentTarget.selectionStart ?? e.currentTarget.value.length,
            end: e.currentTarget.selectionEnd ?? e.currentTarget.value.length,
          }
        } catch {
          vetoedSelectionRef.current = null
        }
        return
      }
      vetoedSelectionRef.current = null
      commitDraft()
    }

    return (
      <Input
        ref={setInputRef}
        type="text"
        id={inputId}
        inputMode={inputMode}
        disabled={disabled}
        readOnly={readOnly}
        required={required}
        aria-invalid={invalid ? 'true' : undefined}
        aria-label={ariaLabel as string | undefined}
        aria-labelledby={ariaLabelledby as string | undefined}
        autoComplete={authoredAutoComplete ?? 'off'}
        autoCorrect={authoredAutoCorrect ?? 'off'}
        spellCheck={authoredSpellCheck ?? false}
        value={draft ?? displayValue}
        data-disabled={disabled ? '' : undefined}
        data-readonly={readOnly ? '' : undefined}
        data-required={required ? '' : undefined}
        data-invalid={invalid ? '' : undefined}
        data-empty={empty ? '' : undefined}
        data-editing={draft !== null ? '' : undefined}
        onChange={onChange}
        onCompositionStart={onCompositionStart}
        onCompositionEnd={onCompositionEnd}
        onKeyDown={onKeyDown}
        onFocus={onFocus}
        onBlur={onBlur}
        className={className}
        style={style}
        {...restProps}
      />
    )
  }
)

// Hold-repeat constants (PATCHES §7 / freeze decision 14): an unprevented
// primary pointerdown steps immediately, the first repeat fires at exactly
// 400ms, then every 60ms; touch/pen movement beyond 8 CSS px cancels.
const REPEAT_START_DELAY = 400
const REPEAT_TICK_DELAY = 60
const TOUCH_CANCEL_DISTANCE_SQ = 8 * 8

function isTouchLikePointerType(pointerType: string): boolean {
  return pointerType === 'touch' || pointerType === 'pen'
}

interface StepperRepeatSession {
  pointerId: number
  pointerType: string
  factor: number
  startX: number
  startY: number
  delayTimer: ReturnType<typeof setTimeout> | null
  intervalTimer: ReturnType<typeof setInterval> | null
  ownerWindow: Window | null
  onOwnerBlur: (() => void) | null
}

type StepperRepeatEndReason = 'release' | 'leave' | 'cancel'

interface StepperRepeatUserHandlers {
  onClick?: React.MouseEventHandler<HTMLButtonElement>
  onPointerDown?: React.PointerEventHandler<HTMLButtonElement>
  onPointerUp?: React.PointerEventHandler<HTMLButtonElement>
  onPointerMove?: React.PointerEventHandler<HTMLButtonElement>
  onPointerEnter?: React.PointerEventHandler<HTMLButtonElement>
  onPointerLeave?: React.PointerEventHandler<HTMLButtonElement>
  onPointerCancel?: React.PointerEventHandler<HTMLButtonElement>
  onLostPointerCapture?: React.PointerEventHandler<HTMLButtonElement>
}

// Shared press-and-hold machine for both steppers (NF-STEP-02..08/10/12..15):
// each step calls the root action once, which commits any dirty candidate
// as its base and ends the edit session (B-19 commit boundary).
// No explicit pointer capture: leave must end the session (NF-STEP-07).
function useStepperRepeat(options: {
  action: ((factor: number) => void) | undefined
  focusInput: (() => void) | undefined
  disabled: boolean
  atBound: boolean
  resetEpoch: number
  replacementEpoch: number
  user: StepperRepeatUserHandlers
}) {
  const { action, focusInput, disabled, atBound, resetEpoch, replacementEpoch, user } = options
  const [pressed, setPressed] = React.useState(false)
  const sessionRef = React.useRef<StepperRepeatSession | null>(null)
  const suppressClickRef = React.useRef(false)
  const reentryArmedRef = React.useRef(false)
  const disarmReentryRef = React.useRef<(() => void) | null>(null)
  // Timer ticks must step from the latest committed value, so they read
  // through a ref mirror refreshed every render (context callbacks rebind).
  const actionRef = React.useRef(action)
  actionRef.current = action

  const clearSessionTimers = React.useCallback(() => {
    const session = sessionRef.current
    if (!session) return
    if (session.delayTimer !== null) {
      clearTimeout(session.delayTimer)
      session.delayTimer = null
    }
    if (session.intervalTimer !== null) {
      clearInterval(session.intervalTimer)
      session.intervalTimer = null
    }
    if (session.ownerWindow && session.onOwnerBlur) {
      session.ownerWindow.removeEventListener('blur', session.onOwnerBlur)
      session.onOwnerBlur = null
    }
  }, [])

  const endSession = React.useCallback(
    (reason: StepperRepeatEndReason) => {
      const session = sessionRef.current
      if (!session) return
      clearSessionTimers()
      sessionRef.current = null
      setPressed(false)
      // Only leave disarms: the pointer is off the button so no compatibility
      // click can follow. Release/cancel arm suppression for the click the
      // browser may still deliver (NF-STEP-03/06/15).
      suppressClickRef.current = reason !== 'leave'
      disarmReentryRef.current?.()
      disarmReentryRef.current = null
      if (reason !== 'leave') {
        reentryArmedRef.current = false
        return
      }
      // Leave arms pressed re-entry (NF-STEP-08). Any release anywhere
      // disarms, so drags starting on other elements never step.
      reentryArmedRef.current = true
      const win = session.ownerWindow
      if (win) {
        const disarm = () => {
          reentryArmedRef.current = false
          disarmReentryRef.current = null
        }
        disarmReentryRef.current = () => win.removeEventListener('pointerup', disarm)
        win.addEventListener('pointerup', disarm, { once: true })
      }
    },
    [clearSessionTimers]
  )

  const startSession = (e: React.PointerEvent<HTMLButtonElement>, factor: number) => {
    // Silent replace: clear any previous session's timers/listeners without
    // touching pressed or suppression (pressed re-entry, NF-STEP-08).
    clearSessionTimers()
    disarmReentryRef.current?.()
    disarmReentryRef.current = null
    reentryArmedRef.current = false
    const ownerWindow = e.currentTarget.ownerDocument?.defaultView ?? null
    const session: StepperRepeatSession = {
      pointerId: e.pointerId,
      pointerType: e.pointerType,
      factor,
      startX: e.clientX,
      startY: e.clientY,
      delayTimer: null,
      intervalTimer: null,
      ownerWindow,
      onOwnerBlur: null,
    }
    sessionRef.current = session
    suppressClickRef.current = true
    setPressed(true)
    if (ownerWindow) {
      const onOwnerBlur = () => endSession('cancel')
      session.onOwnerBlur = onOwnerBlur
      ownerWindow.addEventListener('blur', onOwnerBlur)
    }
    // Immediate step (NF-STEP-03); the initiating modifier is retained for
    // the whole hold because ticks reuse the stored factor.
    actionRef.current?.(factor)
    // Mouse activation focuses or retains Input; touch/pen must not force
    // focus and pop the software keyboard (NF-STEP-10).
    if (!isTouchLikePointerType(e.pointerType)) {
      focusInput?.()
    }
    session.delayTimer = setTimeout(() => {
      if (sessionRef.current !== session) return
      actionRef.current?.(session.factor)
      session.intervalTimer = setInterval(() => {
        if (sessionRef.current !== session) return
        actionRef.current?.(session.factor)
      }, REPEAT_TICK_DELAY)
    }, REPEAT_START_DELAY)
  }

  // Unmount/part removal ends the session with no stale callback (NF-STEP-14).
  React.useEffect(() => {
    return () => {
      clearSessionTimers()
      sessionRef.current = null
      disarmReentryRef.current?.()
      disarmReentryRef.current = null
    }
  }, [clearSessionTimers])

  // Disable, part-disable, read-only, or reaching the bound ends an
  // active hold immediately with no late callback (NF-STEP-13). A disabled
  // button receives no compatibility click, so suppression is disarmed —
  // otherwise the stale flag would swallow the next keyboard activation
  // after re-enable. At-bound keeps suppression armed: the enabled button
  // still receives the release click, which must not double-step.
  React.useEffect(() => {
    if (!sessionRef.current) return
    if (disabled) {
      endSession('cancel')
      suppressClickRef.current = false
    } else if (atBound) {
      endSession('cancel')
    }
  }, [disabled, atBound, endSession])

  // Form reset ends an active hold with no stale callback and no pending
  // click expectation (NF-FORM-08): no compatibility click follows reset.
  const firstResetEpochRef = React.useRef(true)
  React.useEffect(() => {
    if (firstResetEpochRef.current) {
      firstResetEpochRef.current = false
      return
    }
    if (sessionRef.current) {
      endSession('cancel')
      suppressClickRef.current = false
    }
  }, [resetEpoch, endSession])

  // NF-DYNAMIC-05: an authoritative replacement mid-hold ends the session
  // with suppression ARMED — the button stays enabled, so the stale
  // release click arrives and must not step. Only a fresh press steps.
  const firstReplacementEpochRef = React.useRef(true)
  React.useEffect(() => {
    if (firstReplacementEpochRef.current) {
      firstReplacementEpochRef.current = false
      return
    }
    if (sessionRef.current) {
      endSession('cancel')
    }
  }, [replacementEpoch, endSession])

  const handlePointerDown: React.PointerEventHandler<HTMLButtonElement> = e => {
    user.onPointerDown?.(e)
    // A fresh physical press voids any pending compat-click expectation.
    suppressClickRef.current = false
    reentryArmedRef.current = false
    disarmReentryRef.current?.()
    disarmReentryRef.current = null
    // Secondary/auxiliary buttons stay native, never step (NF-STEP-09).
    if (e.button !== 0) return
    if (disabled || e.defaultPrevented || !action) return
    if (!e.isPrimary) {
      // A second pointer while held is the pinch branch: cancel the active
      // session, never start another (NF-STEP-15).
      if (sessionRef.current) endSession('cancel')
      return
    }
    e.preventDefault()
    startSession(e, e.shiftKey ? 10 : 1)
  }

  const handlePointerMove: React.PointerEventHandler<HTMLButtonElement> = e => {
    user.onPointerMove?.(e)
    const session = sessionRef.current
    if (!session || e.pointerId !== session.pointerId) return
    // Only touch/pen movement cancels; mouse uses leave (NF-STEP-15).
    if (!isTouchLikePointerType(session.pointerType)) return
    const dx = session.startX - e.clientX
    const dy = session.startY - e.clientY
    // Squared comparison: exactly 8px retains, beyond 8px cancels.
    if (dx * dx + dy * dy > TOUCH_CANCEL_DISTANCE_SQ) {
      endSession('cancel')
    }
  }

  const endMatchingSession = (e: React.PointerEvent<HTMLButtonElement>, reason: StepperRepeatEndReason) => {
    const session = sessionRef.current
    if (!session || e.pointerId !== session.pointerId) return
    endSession(reason)
  }

  const handlePointerUp: React.PointerEventHandler<HTMLButtonElement> = e => {
    user.onPointerUp?.(e)
    endMatchingSession(e, 'release')
  }

  const handlePointerCancel: React.PointerEventHandler<HTMLButtonElement> = e => {
    user.onPointerCancel?.(e)
    endMatchingSession(e, 'cancel')
  }

  const handleLostPointerCapture: React.PointerEventHandler<HTMLButtonElement> = e => {
    user.onLostPointerCapture?.(e)
    endMatchingSession(e, 'cancel')
  }

  const handlePointerLeave: React.PointerEventHandler<HTMLButtonElement> = e => {
    user.onPointerLeave?.(e)
    endMatchingSession(e, 'leave')
  }

  const handlePointerEnter: React.PointerEventHandler<HTMLButtonElement> = e => {
    user.onPointerEnter?.(e)
    if (sessionRef.current) return
    if ((e.buttons & 1) === 0) {
      // Button-less hover disarms stale re-entry (release outside the window).
      reentryArmedRef.current = false
      return
    }
    if (!reentryArmedRef.current) return
    if (disabled || !action) return
    if (!e.isPrimary) return
    // Pressed re-entry steps immediately with a fresh 400ms delay; it never
    // resumes the old 60ms cadence (NF-STEP-08).
    startSession(e, e.shiftKey ? 10 : 1)
  }

  const handleClick: React.MouseEventHandler<HTMLButtonElement> = e => {
    user.onClick?.(e)
    // Compatibility click after an owned pointer session never duplicates
    // the pointerdown step (NF-STEP-03/10).
    if (suppressClickRef.current) {
      suppressClickRef.current = false
      return
    }
    if (e.button !== 0) return
    if (disabled || e.defaultPrevented || !action) return
    // Keyboard, AT, and programmatic activation without an owned pointerdown
    // performs exactly one step (NF-STEP-02); Shift selects the fixed coarse
    // delta while Alt never creates another amount.
    action(e.shiftKey ? 10 : 1)
    focusInput?.()
  }

  return {
    pressed,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    handlePointerLeave,
    handlePointerEnter,
    handlePointerCancel,
    handleLostPointerCapture,
    handleClick,
  }
}

// PATCHES §6 / freeze decision 12: each stepper requires an authored
// nonempty accessible-name prop — the aria-label | aria-labelledby union
// (nonempty). Shape mirrors NumberField.md NumberFieldStepperName; runtime
// emptiness is diagnosed separately per NF-TYPE-04.
export type NumberFieldStepperName =
  | { 'aria-label': string; 'aria-labelledby'?: string }
  | { 'aria-label'?: string; 'aria-labelledby': string }

// NF-TYPE-03: behavior-owned stepper props, absent from the public part
// types and stripped again at runtime. data-pressed stays declared so its
// managed ownership is visible; any authored value is stripped.
export type NumberFieldManagedStepperProp =
  | 'type'
  | 'tabIndex'
  | 'role'
  | 'aria-controls'
  | 'aria-disabled'
  | 'aria-readonly'
  | 'aria-required'
  | 'aria-checked'
  | 'aria-pressed'
  | 'aria-valuemin'
  | 'aria-valuemax'
  | 'aria-valuenow'
  | 'aria-valuetext'

export type NumberFieldIncrementProps = Omit<
  PrimitiveProps<'button'>,
  NumberFieldManagedStepperProp | 'aria-label' | 'aria-labelledby'
> &
  NumberFieldStepperName & {
    /** Managed by the press-and-hold session machine; any authored value is stripped. */
    'data-pressed'?: string
  }

// Dev-only diagnostic writer (Combobox/Splitter globalProcess pattern:
// the package declares no node types, so process comes via globalThis).
const globalProcess = (globalThis as { process?: { env?: { NODE_ENV?: string } } }).process

function numberFieldDevDiagnostic(message: string) {
  if (globalProcess?.env?.NODE_ENV === 'production') return
  console.error(`Reference UI: NumberField ${message}`)
}

// Layout effect where a window exists, passive effect under SSR (avoids the
// server useLayoutEffect warning for labelledby verification).
const useIsomorphicLayoutEffect = typeof window === 'undefined' ? React.useEffect : React.useLayoutEffect

function stepperNameText(value: unknown): string {
  if (typeof value === 'string') return value
  if (value === null || value === undefined) return ''
  return String(value)
}

function stepperNameIds(labelledbyText: string): string[] {
  const trimmed = labelledbyText.trim()
  return trimmed === '' ? [] : trimmed.split(/\s+/)
}

// PATCHES §6 runtime: missing, empty, or unresolved stepper naming fails
// with a descriptive dev diagnostic; the offender renders nothing and so
// neither registers nor activates (no registration system exists until §4).
// Labelledby targets only exist in committed DOM, so verification runs in a
// layout effect: the first paint assumes named (SSR/hydration-safe) and an
// unresolved name hides pre-paint. Targets must be committed with the
// stepper — a later-mounting target with unchanged props does not re-verify.
// Effective-name semantics follow the
// platform: a present labelledby overrides aria-label, so it must resolve
// to a nonempty name even when a label is also authored.
function useStepperName(
  kind: 'Increment' | 'Decrement',
  ariaLabel: unknown,
  ariaLabelledby: unknown,
  buttonRef?: React.RefObject<HTMLButtonElement | null>
): boolean {
  const labelValid = stepperNameText(ariaLabel).trim() !== ''
  const labelledbyText = stepperNameText(ariaLabelledby)
  const usesLabelledby = stepperNameIds(labelledbyText).length > 0
  const [labelledbyValid, setLabelledbyValid] = React.useState<boolean | null>(null)
  const loggedRef = React.useRef(false)

  useIsomorphicLayoutEffect(() => {
    if (!usesLabelledby || typeof document === 'undefined') return
    const ids = stepperNameIds(labelledbyText)
    // NF-ENV-06: labelledby targets resolve in the stepper's owner root
    // (open ShadowRoot included) — never document-global.
    const root =
      (buttonRef?.current?.getRootNode() as Document | ShadowRoot | undefined) ?? document
    const elements = ids.map(id => root.getElementById(id))
    const name = elements
      .map(el => (el === null ? '' : el.getAttribute('aria-label') || el.textContent || ''))
      .join(' ')
    setLabelledbyValid(elements.every(el => el !== null) && name.trim() !== '')
  }, [usesLabelledby, labelledbyText, buttonRef])

  let named = true
  let reason = ''
  if (usesLabelledby) {
    if (labelledbyValid === false) {
      named = false
      reason =
        `${kind} has an "aria-labelledby" that does not resolve to a nonempty accessible name ` +
        `("${labelledbyText}") — the stepper was not rendered and will not activate.`
    }
  } else if (!labelValid) {
    named = false
    reason =
      `${kind} requires a nonempty authored "aria-label" or a resolving "aria-labelledby" — ` +
      `no English fallback exists, so the stepper was not rendered and will not activate.`
  }

  useIsomorphicLayoutEffect(() => {
    if (named || loggedRef.current) return
    loggedRef.current = true
    numberFieldDevDiagnostic(reason)
  }, [named, reason])

  return named
}

export const NumberFieldIncrement = React.forwardRef<HTMLButtonElement, NumberFieldIncrementProps>(
  function NumberFieldIncrement(
    {
      children,
      className,
      style,
      onClick,
      onPointerDown,
      onPointerUp,
      onPointerMove,
      onPointerEnter,
      onPointerLeave,
      onPointerCancel,
      onLostPointerCapture,
      'aria-label': ariaLabel,
      'aria-labelledby': ariaLabelledby,
      disabled: authoredDisabled,
      ...props
    },
    ref
  ) {
    const context = React.useContext(NumberFieldContext)
    if (!context) {
      throw new Error(
        'Reference UI: NumberField.Increment must be used inside <NumberField> — it has no behavior outside the field.'
      )
    }
    const groupScope = React.useContext(NumberFieldGroupContext)
    if (!groupScope) {
      throw new Error(
        'Reference UI: NumberField.Increment must be a direct child of <NumberField.Group> — misplaced parts never join behavior.'
      )
    }

    // Managed authority (NF-TYPE-03, NF-DOM-06): behavior-owned props are
    // stripped so conflicting runtime casts cannot break the stepper.
    const {
      type: _managedType,
      tabIndex: _managedTabIndex,
      role: _managedRole,
      'aria-controls': _managedControls,
      'aria-disabled': _managedAriaDisabled,
      'aria-readonly': _managedAriaReadonly,
      'aria-required': _managedAriaRequired,
      'aria-checked': _managedAriaChecked,
      'aria-pressed': _managedAriaPressed,
      'aria-valuemin': _managedValueMin,
      'aria-valuemax': _managedValueMax,
      'aria-valuenow': _managedValueNow,
      'aria-valuetext': _managedValueText,
      'data-pressed': _managedPressed,
      ...restProps
    } = props as Record<string, unknown>

    // Capability follows controlled or complete dirty state, bounds, root
    // state, and authored disabled (NF-STEP-11). Structural type/tabIndex/
    // controls stay managed (NF-TYPE-03); the accessible name is required,
    // validated, and passed through explicitly.
    const base = context.stepBase ?? context.value
    const max = context.max
    const atBound = base !== null && max !== undefined && max !== Infinity && base >= max
    const isDisabled = context.disabled || context.readOnly || authoredDisabled || atBound || false

    // Internal button node for owner-root name resolution (NF-ENV-06),
    // merged with the forwarded ref below.
    const buttonRef = React.useRef<HTMLButtonElement | null>(null)
    const setButtonRef = React.useCallback(
      (node: HTMLButtonElement | null) => {
        buttonRef.current = node
        if (typeof ref === 'function') {
          ref(node)
        } else if (ref) {
          ;(ref as React.MutableRefObject<HTMLButtonElement | null>).current = node
        }
      },
      [ref]
    )

    // Required-name gate (PATCHES §6): hooks run unconditionally so
    // named↔unnamed transitions never change the hook count; the null
    // return below is the "neither registers nor activates" branch.
    const named = useStepperName('Increment', ariaLabel, ariaLabelledby, buttonRef)

    // Named-part registration (NF-DOM-03): unnamed steppers render nothing
    // and never register, so they cannot join behavior.
    const registerPart = groupScope.registerPart
    useIsomorphicLayoutEffect(() => {
      if (!named) return
      return registerPart('increment')
    }, [named, registerPart])

    // Press-and-hold stepping (PATCHES §7): consumer handlers chain first
    // inside the hook, so authored pointer props can never clobber the
    // session machine via the trailing spread.
    const repeat = useStepperRepeat({
      action: context.increment,
      focusInput: context.focusInput,
      disabled: isDisabled,
      atBound,
      resetEpoch: context.resetEpoch,
      replacementEpoch: context.replacementEpoch,
      user: {
        onClick,
        onPointerDown,
        onPointerUp,
        onPointerMove,
        onPointerEnter,
        onPointerLeave,
        onPointerCancel,
        onLostPointerCapture,
      },
    })

    if (!named) return null

    return (
      <Button
        ref={setButtonRef}
        type="button"
        tabIndex={-1}
        aria-label={ariaLabel}
        aria-labelledby={ariaLabelledby}
        aria-controls={context.inputId}
        disabled={isDisabled}
        data-disabled={isDisabled ? '' : undefined}
        data-pressed={repeat.pressed ? '' : undefined}
        onClick={repeat.handleClick}
        onPointerDown={repeat.handlePointerDown}
        onPointerUp={repeat.handlePointerUp}
        onPointerMove={repeat.handlePointerMove}
        onPointerEnter={repeat.handlePointerEnter}
        onPointerLeave={repeat.handlePointerLeave}
        onPointerCancel={repeat.handlePointerCancel}
        onLostPointerCapture={repeat.handleLostPointerCapture}
        height="100%"
        aspectRatio="1 / 1"
        p="0"
        m="0"
        border="none"
        bg="transparent"
        borderRadius="sm"
        display="inline-flex"
        alignItems="center"
        justifyContent="center"
        flexShrink={0}
        color="design.text.base"
        cursor={isDisabled ? 'not-allowed' : 'pointer'}
        opacity={isDisabled ? 0.5 : 1}
        outline="none"
        _hover={!isDisabled ? { bg: 'ui.button.mutedBackground', color: 'design.text.base' } : undefined}
        _active={!isDisabled ? { bg: 'ui.table.row.mutedBackground' } : undefined}
        _focusVisible={{ outline: '2px solid', outlineColor: 'ui.focus.ring', outlineOffset: '1px' }}
        className={className}
        style={{
          aspectRatio: '1 / 1',
          height: '100%',
          margin: 0,
          ...style,
        }}
        {...restProps}
      >
        {children ?? (
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        )}
      </Button>
    )
  }
)

export type NumberFieldDecrementProps = Omit<
  PrimitiveProps<'button'>,
  NumberFieldManagedStepperProp | 'aria-label' | 'aria-labelledby'
> &
  NumberFieldStepperName & {
    /** Managed by the press-and-hold session machine; any authored value is stripped. */
    'data-pressed'?: string
  }

export const NumberFieldDecrement = React.forwardRef<HTMLButtonElement, NumberFieldDecrementProps>(
  function NumberFieldDecrement(
    {
      children,
      className,
      style,
      onClick,
      onPointerDown,
      onPointerUp,
      onPointerMove,
      onPointerEnter,
      onPointerLeave,
      onPointerCancel,
      onLostPointerCapture,
      'aria-label': ariaLabel,
      'aria-labelledby': ariaLabelledby,
      disabled: authoredDisabled,
      ...props
    },
    ref
  ) {
    const context = React.useContext(NumberFieldContext)
    if (!context) {
      throw new Error(
        'Reference UI: NumberField.Decrement must be used inside <NumberField> — it has no behavior outside the field.'
      )
    }
    const groupScope = React.useContext(NumberFieldGroupContext)
    if (!groupScope) {
      throw new Error(
        'Reference UI: NumberField.Decrement must be a direct child of <NumberField.Group> — misplaced parts never join behavior.'
      )
    }

    // Managed authority (NF-TYPE-03, NF-DOM-06): behavior-owned props are
    // stripped so conflicting runtime casts cannot break the stepper.
    const {
      type: _managedType,
      tabIndex: _managedTabIndex,
      role: _managedRole,
      'aria-controls': _managedControls,
      'aria-disabled': _managedAriaDisabled,
      'aria-readonly': _managedAriaReadonly,
      'aria-required': _managedAriaRequired,
      'aria-checked': _managedAriaChecked,
      'aria-pressed': _managedAriaPressed,
      'aria-valuemin': _managedValueMin,
      'aria-valuemax': _managedValueMax,
      'aria-valuenow': _managedValueNow,
      'aria-valuetext': _managedValueText,
      'data-pressed': _managedPressed,
      ...restProps
    } = props as Record<string, unknown>

    // Capability follows controlled or complete dirty state, bounds, root
    // state, and authored disabled (NF-STEP-11). Structural type/tabIndex/
    // controls stay managed (NF-TYPE-03); the accessible name is required,
    // validated, and passed through explicitly.
    const base = context.stepBase ?? context.value
    const min = context.min
    const atBound = base !== null && min !== undefined && min !== -Infinity && base <= min
    const isDisabled = context.disabled || context.readOnly || authoredDisabled || atBound || false

    // Internal button node for owner-root name resolution (NF-ENV-06),
    // merged with the forwarded ref below.
    const buttonRef = React.useRef<HTMLButtonElement | null>(null)
    const setButtonRef = React.useCallback(
      (node: HTMLButtonElement | null) => {
        buttonRef.current = node
        if (typeof ref === 'function') {
          ref(node)
        } else if (ref) {
          ;(ref as React.MutableRefObject<HTMLButtonElement | null>).current = node
        }
      },
      [ref]
    )

    // Required-name gate (PATCHES §6): hooks run unconditionally so
    // named↔unnamed transitions never change the hook count; the null
    // return below is the "neither registers nor activates" branch.
    const named = useStepperName('Decrement', ariaLabel, ariaLabelledby, buttonRef)

    // Named-part registration (NF-DOM-03): unnamed steppers render nothing
    // and never register, so they cannot join behavior.
    const registerPart = groupScope.registerPart
    useIsomorphicLayoutEffect(() => {
      if (!named) return
      return registerPart('decrement')
    }, [named, registerPart])

    // Press-and-hold stepping (PATCHES §7): consumer handlers chain first
    // inside the hook, so authored pointer props can never clobber the
    // session machine via the trailing spread.
    const repeat = useStepperRepeat({
      action: context.decrement,
      focusInput: context.focusInput,
      disabled: isDisabled,
      atBound,
      resetEpoch: context.resetEpoch,
      replacementEpoch: context.replacementEpoch,
      user: {
        onClick,
        onPointerDown,
        onPointerUp,
        onPointerMove,
        onPointerEnter,
        onPointerLeave,
        onPointerCancel,
        onLostPointerCapture,
      },
    })

    if (!named) return null

    return (
      <Button
        ref={setButtonRef}
        type="button"
        tabIndex={-1}
        aria-label={ariaLabel}
        aria-labelledby={ariaLabelledby}
        aria-controls={context.inputId}
        disabled={isDisabled}
        data-disabled={isDisabled ? '' : undefined}
        data-pressed={repeat.pressed ? '' : undefined}
        onClick={repeat.handleClick}
        onPointerUp={repeat.handlePointerUp}
        onPointerDown={repeat.handlePointerDown}
        onPointerMove={repeat.handlePointerMove}
        onPointerEnter={repeat.handlePointerEnter}
        onPointerLeave={repeat.handlePointerLeave}
        onPointerCancel={repeat.handlePointerCancel}
        onLostPointerCapture={repeat.handleLostPointerCapture}
        height="100%"
        aspectRatio="1 / 1"
        p="0"
        m="0"
        border="none"
        bg="transparent"
        borderRadius="sm"
        display="inline-flex"
        alignItems="center"
        justifyContent="center"
        flexShrink={0}
        color="design.text.base"
        cursor={isDisabled ? 'not-allowed' : 'pointer'}
        opacity={isDisabled ? 0.5 : 1}
        outline="none"
        _hover={!isDisabled ? { bg: 'ui.button.mutedBackground', color: 'design.text.base' } : undefined}
        _active={!isDisabled ? { bg: 'ui.table.row.mutedBackground' } : undefined}
        _focusVisible={{ outline: '2px solid', outlineColor: 'ui.focus.ring', outlineOffset: '1px' }}
        className={className}
        style={{
          aspectRatio: '1 / 1',
          height: '100%',
          margin: 0,
          ...style,
        }}
        {...restProps}
      >
        {children ?? (
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        )}
      </Button>
    )
  }
)

// Grammar-derived inputMode (freeze decision 11, NF-ENV-07): follows the
// accepted character grammar and commit policy, never UA detection or
// resolved display rounding alone.
function deriveInputMode(args: {
  commitBehavior: NumberFieldCommitBehavior
  min: number
  step: number
  percentStyle: boolean
  notation: string | undefined
  formatOptions: Intl.NumberFormatOptions | undefined
}): 'text' | 'decimal' | 'numeric' {
  const { commitBehavior, min, step, percentStyle, notation, formatOptions } = args
  // Validate mode keeps negative underflow editable even when min >= 0.
  if (commitBehavior === 'validate') return 'text'
  // Scientific/engineering grammars need exponent and sign characters.
  if (notation === 'scientific' || notation === 'engineering') return 'text'
  // Minus is accepted unless a nonnegative lower bound rejects it. 'none'
  // derives like snap (flagged for HQ in the mission log): it differs in
  // commit coercion, not in the minus grammar of nonnegative fields.
  if (min === -Infinity || min < 0) return 'text'
  // A fraction is admitted by authored precision or a fractional display
  // step. Resolved display rounding alone never admits it — neither the
  // percent default (0 digits) nor the currency default (2 digits) counts
  // as explicit fractional grammar (NF-COMP-03 direction).
  const authoredFraction =
    (formatOptions?.minimumFractionDigits ?? 0) > 0 ||
    (formatOptions?.maximumFractionDigits ?? 0) > 0 ||
    formatOptions?.minimumSignificantDigits !== undefined ||
    formatOptions?.maximumSignificantDigits !== undefined
  if (authoredFraction) return 'decimal'
  const displayStep = percentStyle ? step * 100 : step
  if (Math.abs(displayStep - Math.round(displayStep)) > 1e-9) return 'decimal'
  return 'numeric'
}

// Explicit Input id wins for the shared inputId (NF-DOM-07): the root
// scans the direct Group for the direct Input and reads its id prop, so
// steppers retarget in the same commit. Anything else falls back to the
// generated id.
function directInputId(children: React.ReactNode, fallback: string): { inputId: string; explicit: boolean } {
  for (const child of React.Children.toArray(children)) {
    if (!isNumberFieldPart(child, NumberFieldGroup)) continue
    const groupKids = React.Children.toArray((child.props.children ?? null) as React.ReactNode)
    for (const grandchild of groupKids) {
      if (isNumberFieldPart(grandchild, NumberFieldInput)) {
        const id = grandchild.props.id
        if (typeof id === 'string' && id !== '') return { inputId: id, explicit: true }
        return { inputId: fallback, explicit: false }
      }
    }
  }
  return { inputId: fallback, explicit: false }
}

export const NumberField = React.forwardRef<HTMLDivElement, NumberFieldProps>(
  function NumberField(
    {
      children,
      value,
      onChange,
      locale,
      min = -Infinity,
      max = Infinity,
      step: stepProp,
      disabled = false,
      readOnly = false,
      required = false,
      invalid: appInvalid = false,
      name,
      form,
      formatOptions,
      commitBehavior = 'none',
      onInvalidCommit,
      className,
      style,
      ...props
    },
    ref
  ) {
    // Runtime validation of numeric props (NF-MATH-02, adapted): fail fast
    // on NaN/unusable props instead of poisoning state. Unlike quarantine,
    // ±Infinity bounds stay legal — they are this engine's unbounded
    // sentinels (the defaults). Render-phase pure checks: StrictMode-safe.
    // FEATURES #1: value is required-controlled (null is the empty value)
    // and locale is required with no environment default; there is no
    // defaultValue and no uncontrolled mode.
    if (value === undefined) {
      throw new Error(
        'Reference UI: NumberField "value" is required — the field is fully controlled, with null as the empty value.'
      )
    }
    if (value !== null && !Number.isFinite(value)) {
      throw new Error('Reference UI: NumberField "value" must be a finite number or null.')
    }
    if (locale == null) {
      throw new Error('Reference UI: NumberField "locale" is required — pass an explicit locale (no environment default).')
    }
    if (Number.isNaN(min)) {
      throw new Error('Reference UI: NumberField "min" must be a number.')
    }
    if (Number.isNaN(max)) {
      throw new Error('Reference UI: NumberField "max" must be a number.')
    }
    if (min > max) {
      throw new Error('Reference UI: NumberField "min" must be less than or equal to "max".')
    }
    if (commitBehavior !== 'snap' && commitBehavior !== 'validate' && commitBehavior !== 'none') {
      throw new Error('Reference UI: NumberField "commitBehavior" must be "snap", "validate", or "none".')
    }

    // W-25: the display formatter. Construction fails fast on a bad locale
    // or option pair (Intl RangeError/TypeError) with the props named.
    const formatter = React.useMemo(() => {
      try {
        return new Intl.NumberFormat(locale, formatOptions)
      } catch (error) {
        throw new Error(
          `Reference UI: NumberField "locale"/"formatOptions" are not a valid Intl.NumberFormat pair — ${
            error instanceof Error ? error.message : String(error)
          }`
        )
      }
    }, [locale, formatOptions])
    const percentStyle = React.useMemo(
      () => formatter.resolvedOptions().style === 'percent',
      [formatter]
    )
    const notation = React.useMemo(() => formatter.resolvedOptions().notation, [formatter])
    // NF-PARSE-16: compact notation and hidden-sign display fail before
    // accepting edits — the editor cannot round-trip abbreviated or
    // signless output, so no fallback editor is offered.
    const resolvedFormat = formatter.resolvedOptions()
    if (resolvedFormat.notation === 'compact') {
      throw new Error(
        'Reference UI: NumberField "formatOptions" with compact notation is not editable — abbreviated output has no invertible grammar.'
      )
    }
    if (resolvedFormat.signDisplay === 'never') {
      throw new Error(
        'Reference UI: NumberField "formatOptions" with signDisplay "never" is not editable — negatives have no written form.'
      )
    }
    // The numberingSystem option falls back silently too (roman → latn) —
    // a refused request is a fallback editor, so it fails like the locale.
    if (
      formatOptions?.numberingSystem &&
      resolvedFormat.numberingSystem !== formatOptions.numberingSystem
    ) {
      throw new Error(
        `Reference UI: NumberField "formatOptions" requests numbering system "${formatOptions.numberingSystem}" but Intl resolves "${resolvedFormat.numberingSystem}" — this field is not editable.`
      )
    }
    // Parse symbols come from a default-grouping formatter so a grouped
    // paste still parses under useGrouping:false (NF-PARSE-07 direction) —
    // but with the display formatter's resolved numbering system, so the
    // parser accepts exactly the digits the field renders (NF-PARSE-02).
    const symbols = React.useMemo(
      () => draftNumberSymbols(locale, formatOptions),
      [locale, formatOptions]
    )

    // W-25: percent fields step hundredths by default (React Aria parity);
    // every other style keeps the historic step 1.
    const step = stepProp ?? (percentStyle ? 0.01 : 1)
    if (!Number.isFinite(step) || step <= 0) {
      throw new Error('Reference UI: NumberField "step" must be a finite number greater than 0.')
    }

    // W-02: the ±Infinity sentinels read as absent bounds to the lattice.
    const latticeMin = min === -Infinity ? undefined : min
    const latticeMax = max === Infinity ? undefined : max

    const inputRef = React.useRef<HTMLInputElement | null>(null)
    const hiddenRef = React.useRef<HTMLInputElement | null>(null)

    // The dirty edit session (B-19 verbatim draft + NFLAST ruling (c)
    // live-request). Typing stages the draft verbatim so bounded decimals
    // like "2.5" survive the "." keystroke instead of clamping to the max;
    // newly parseable meanings are requested live (raw); commit boundaries
    // (blur, Enter, handled steps) flush whatever differs from control.
    const [draft, setDraft] = React.useState<string | null>(null)
    const draftRef = React.useRef<string | null>(null)
    draftRef.current = draft
    // Controlled-value mirror for listeners/effects whose dependency lists
    // must not resubscribe per value (reset sync below).
    const valueRef = React.useRef<number | null>(value)
    valueRef.current = value

    // Failed-boundary + pending-request submit blocking (NF-COMMIT-07,
    // NF-FORM-05/06/11/12). A failed boundary is set by invalid, incomplete,
    // or validate-rejected commits; a pending request is set by any commit
    // or step the parent has not echoed yet. Both block submit without
    // consuming themselves; both clear only on a new user edit, an echo or
    // authoritative programmatic change, or an unprevented reset. The ref
    // mirror lets native submit listeners read synchronously.
    const [failedBoundary, setFailedBoundaryState] = React.useState(false)
    const failedBoundaryRef = React.useRef(false)
    const setFailedBoundary = React.useCallback((failed: boolean) => {
      failedBoundaryRef.current = failed
      setFailedBoundaryState(failed)
    }, [])
    const pendingRequestRef = React.useRef(false)
    const clearTransientFailures = React.useCallback(() => {
      pendingRequestRef.current = false
      setFailedBoundary(false)
    }, [setFailedBoundary])

    // Form reset generation (NF-FORM-08/14): steppers end active holds when
    // it advances; the post-reset sync effect re-syncs controlled inputs.
    const [resetEpoch, setResetEpoch] = React.useState(0)

    // W-25: clean-state text is the Intl formatting of the controlled
    // value; null is the only clean empty display (NF-FORMAT-02). A
    // programmatic -0 renders "0" (String parity — Intl would print "-0",
    // NF-MATH-14); interaction-produced -0 never reaches here.
    const displayValue = React.useMemo(() => {
      if (value === null) return ''
      return formatter.format(Object.is(value, -0) ? 0 : value)
    }, [formatter, value])

    // NFLAST ruling (c): the latest requested numeric meaning (live or
    // commit). A controlled value change matching it is the latest echo —
    // the dirty session survives with exact text/caret (NF-COMMIT-08);
    // anything else is a stale echo or an unrelated replacement: the
    // buffer is replaced from controlled state and the session ends with
    // zero callback (NF-COMMIT-11, NF-DYNAMIC-01). Either way the change
    // is authoritative and clears pending/failed transient state. The ref
    // also dedupes live requests (NF-EDIT-03/05).
    const lastLiveRef = React.useRef<number | null>(value)
    // NF-EDIT-11: an open IME/synthetic composition suspends live publish
    // (stepping/commit already suspend via isComposing in handleKeyDown).
    // Staged text still buffers verbatim; the final event only ends the
    // suspension — publish happens at the next input event or boundary.
    const composingRef = React.useRef(false)
    // NF-EDIT-12: pre-composition draft snapshot for invalid-final restore.
    const compositionSnapshotRef = React.useRef<string | null>(null)
    // NF-EDIT-17/18: an authoritative replacement during composition arms
    // one swallow — the stale end/input fallout is ignored (and the DOM
    // node is reverted to controlled text, since no state change follows).
    const compositionFalloutRef = React.useRef(false)
    // NF-DYNAMIC-05: disable/read-only/part-removal cancels an open
    // composition session outright (no fallout swallow — nothing was
    // replaced); the stale compositionend is then ignored once.
    const compositionCancelRef = React.useRef(false)
    // NF-ENV-02 pre-commit SSR capture (node + serialized text), taken
    // once on the first render and validated by the mount effect.
    const icuCaptureRef = React.useRef<{ node: HTMLInputElement; text: string } | null>(null)
    const icuCaptureDoneRef = React.useRef(false)
    // NF-EDIT-07: pre-commit caret capture (text + selection read during
    // render, while the DOM still holds the outgoing text) and the one-shot
    // skip a composition invalidation consumes — its explicit end placement
    // is the placement, never a logical remap.
    const caretCaptureRef = React.useRef<{ text: string; start: number; end: number } | null>(null)
    const caretRestoreSkipRef = React.useRef(false)
    const invalidateComposition = React.useCallback((displayLength: number) => {
      if (!composingRef.current) return
      composingRef.current = false
      compositionSnapshotRef.current = null
      compositionFalloutRef.current = true
      caretRestoreSkipRef.current = true
      const node = inputRef.current
      if (node) {
        try {
          node.setSelectionRange(displayLength, displayLength)
        } catch {
          // ignore if not supported
        }
      }
    }, [])
    // NF-DYNAMIC-05: non-echo controlled replacements and effective
    // locale/format swaps advance the replacement generation — active
    // stepper holds end without a stale release step (their own echoes
    // never bump, so holds survive normal ticking).
    const [replacementEpoch, setReplacementEpoch] = React.useState(0)
    React.useEffect(() => {
      const echoed = value === lastLiveRef.current
      lastLiveRef.current = value
      clearTransientFailures()
      if (!echoed) {
        draftRef.current = null
        setDraft(null)
        setReplacementEpoch(epoch => epoch + 1)
        invalidateComposition(displayValue.length)
      }
    }, [value, clearTransientFailures, invalidateComposition, displayValue])

    // W-25: an effective locale/format change replaces a dirty draft from
    // controlled state (React Aria parity); a referentially new but
    // effectively equal formatOptions object preserves the session.
    // Effective changes are authoritative and clear failed/pending too.
    // The live-dedupe ref resets to control: dedupe is per-session, so a
    // new session re-requests even a meaning the old session published.
    const prevFormatRef = React.useRef({ locale, formatOptions })
    React.useEffect(() => {
      const prev = prevFormatRef.current
      if (prev.locale !== locale || !isEqualFormatOptions(prev.formatOptions, formatOptions)) {
        prevFormatRef.current = { locale, formatOptions }
        lastLiveRef.current = value
        draftRef.current = null
        setDraft(null)
        setReplacementEpoch(epoch => epoch + 1)
        clearTransientFailures()
        invalidateComposition(displayValue.length)
      }
    }, [locale, formatOptions, clearTransientFailures, value, invalidateComposition, displayValue])

    // NF-DYNAMIC-05: disabling or read-locking mid-composition cancels
    // the session — staged text stays for the blur boundary (disable
    // natively blurs a focused input), but the session no longer suspends
    // publish and its stale end is ignored once.
    React.useEffect(() => {
      if ((disabled || readOnly) && composingRef.current) {
        composingRef.current = false
        compositionSnapshotRef.current = null
        compositionCancelRef.current = true
      }
    }, [disabled, readOnly])

    // NF-EDIT-07: formatting replacements preserve the caret by logical
    // digit. The capture (taken during render, pre-commit) holds the
    // outgoing text and selection; when the committed text differs and the
    // input still has focus in its own root, each selection edge follows
    // its preceding-digit count into the new text. Typing commits are
    // exact-text no-ops (capture equals render); blurred replacements keep
    // the browser default; unsupported selection APIs fail open.
    const renderedText = draft ?? displayValue
    useIsomorphicLayoutEffect(() => {
      if (caretRestoreSkipRef.current) {
        caretRestoreSkipRef.current = false
        return
      }
      const node = inputRef.current
      const capture = caretCaptureRef.current
      if (!node || !capture || capture.text === renderedText) return
      const root = node.getRootNode() as Document | ShadowRoot
      if (root.activeElement !== node) return
      const digits = symbols.digits
      const mapOffset = (offset: number): number => {
        const clamped = Math.max(0, Math.min(offset, capture.text.length))
        let count = 0
        for (const char of Array.from(capture.text.slice(0, clamped))) {
          if (isLogicalDigitChar(char, digits)) count += 1
        }
        return offsetAfterLogicalDigits(renderedText, count, digits)
      }
      try {
        node.setSelectionRange(mapOffset(capture.start), mapOffset(capture.end))
      } catch {
        // ignore if not supported
      }
    }, [renderedText, symbols])

    // Authoritative constraint changes revalidate and clear failed/pending
    // (NF-COMMIT-07, NF-DYNAMIC-03): the new bounds/step/policy supersede
    // any retained boundary. State itself recomputes from props each render.
    const prevConstraintsRef = React.useRef({ min, max, step, commitBehavior })
    React.useEffect(() => {
      const prev = prevConstraintsRef.current
      if (
        prev.min !== min ||
        prev.max !== max ||
        prev.step !== step ||
        prev.commitBehavior !== commitBehavior
      ) {
        prevConstraintsRef.current = { min, max, step, commitBehavior }
        lastLiveRef.current = value
        clearTransientFailures()
      }
    }, [min, max, step, commitBehavior, clearTransientFailures, value])

    const focusInput = React.useCallback(() => {
      if (inputRef.current) {
        inputRef.current.focus()
        const len = inputRef.current.value.length
        try {
          inputRef.current.setSelectionRange(len, len)
        } catch {
          // ignore if not supported
        }
      }
    }, [])

    // A complete dirty candidate (parseable, clamped once) is the step base;
    // empty or incomplete drafts fall back to controlled value, never NaN.
    // The locale parser (W-25) lets formatted drafts ("1,000", "12" under a
    // percent style) step from their numeric meaning.
    const stepBase = React.useMemo(() => {
      if (draft === null || draft.trim() === '') return null
      const num = parseDraftNumber(draft, symbols, percentStyle)
      if (Number.isNaN(num)) return null
      return Math.max(min, Math.min(max, num))
    }, [draft, symbols, percentStyle, min, max])

    // React Aria commit parity: authored display precision applies to the
    // committed number (format, then re-parse). Styles whose text cannot
    // round-trip through the modest parser (compact, units) keep the
    // pre-rounding candidate instead of failing the commit.
    const displayRoundTrip = React.useCallback(
      (candidate: number): number => {
        const reparsed = parseDraftNumber(formatter.format(candidate), symbols, percentStyle)
        return Number.isNaN(reparsed) ? candidate : reparsed
      },
      [formatter, symbols, percentStyle]
    )

    // Grammar-derived keyboard hint (NF-ENV-07): deterministic from
    // props/Intl, stable across SSR.
    const managedInputMode = React.useMemo(
      () =>
        deriveInputMode({
          commitBehavior,
          min,
          step,
          percentStyle,
          notation,
          formatOptions,
        }),
      [commitBehavior, min, step, percentStyle, notation, formatOptions]
    )

    // Owned numeric-constraint state (NF-MATH-15, NF-COMMIT-06, NF-FORM-05):
    // bound and step validity of the controlled value in snap/validate
    // modes. 'none' clamps at commit and owns no invalid state. Native
    // text-input range/step
    // flags always stay false; this state surfaces only through managed
    // aria-invalid/data-invalid, stepper capability, and submit blocking —
    // never setCustomValidity.
    const ownedInvalid = React.useMemo(() => {
      if (value === null || commitBehavior === 'none') return false
      if (latticeMin !== undefined && value < latticeMin) return true
      if (latticeMax !== undefined && value > latticeMax) return true
      if (commitBehavior === 'validate') {
        return !isOnStepLattice(value, step)
      }
      // Snap: an exact supplied endpoint is step-valid by endpoint
      // exception even off lattice; the explicitly rounded image of a
      // lattice point is valid too, so the required post-snap rounding
      // order cannot make a successful snap commit immediately invalid.
      if (value === latticeMin || value === latticeMax) return false
      if (isOnStepLattice(value, step)) return false
      return displayRoundTrip(snapValueToLattice(value, latticeMin, latticeMax, step)) !== value
    }, [value, commitBehavior, latticeMin, latticeMax, step, displayRoundTrip])

    // Managed invalid union: application invalid, owned numeric-constraint
    // state, or a retained failed boundary. Application false cannot hide
    // owned failure; application true alone never blocks submit.
    const managedInvalid = appInvalid || ownedInvalid || failedBoundary

    // Canonical hidden form value (NF-FORM-01): "" for null, String(value)
    // otherwise. Interaction -0 never reaches here (canonicalized at the
    // request site); a programmatic -0 renders "0" via String parity.
    const canonicalHiddenValue = value === null ? '' : String(value)

    // Every requested candidate is pending until the parent echoes it or
    // an authoritative change supersedes it; un-acked requests block
    // submit so stale hidden state can never serialize (NF-COMMIT-07).
    const requestValue = React.useCallback(
      (candidate: number | null) => {
        pendingRequestRef.current = true
        onChange?.(candidate)
      },
      [onChange]
    )

    const increment = React.useCallback(
      (factor = 1) => {
        if (disabled || readOnly) return
        // Step actions are commit boundaries: the session ends even when
        // the step itself is suppressed (FEATURES #2: no change → no event).
        setDraft(null)
        // Per-session live dedupe resets to control with the session end.
        lastLiveRef.current = value
        const base = stepBase ?? value
        // First step from null selects the in-range value nearest zero
        // (NF-MATH-05) — no additional step, so the factor is ignored.
        if (base === null) {
          const first = Math.min(max, Math.max(min, 0))
          lastLiveRef.current = first
          requestValue(first)
          return
        }
        // Directional lattice step, clamped to the exact endpoint
        // (NF-MATH-04/06): off-grid bases move strictly in-direction.
        const nextVal = cleanFloat(Math.min(max, stepLatticeInDirection(base, 1, step, factor)))
        if (nextVal === value) return
        // NF-DYNAMIC-05: steps are requests — the echo path recognizes the
        // echo (holds survive their own ticks; only unrelated replacements
        // advance the replacement generation).
        lastLiveRef.current = nextVal
        requestValue(nextVal)
      },
      [value, min, max, step, stepBase, disabled, readOnly, requestValue]
    )

    const decrement = React.useCallback(
      (factor = 1) => {
        if (disabled || readOnly) return
        // Step actions are commit boundaries: the session ends even when
        // the step itself is suppressed (FEATURES #2: no change → no event).
        setDraft(null)
        // Per-session live dedupe resets to control with the session end.
        lastLiveRef.current = value
        const base = stepBase ?? value
        // First step from null selects the in-range value nearest zero
        // (NF-MATH-05) — no additional step, so the factor is ignored.
        if (base === null) {
          const first = Math.min(max, Math.max(min, 0))
          lastLiveRef.current = first
          requestValue(first)
          return
        }
        // Directional lattice step, clamped to the exact endpoint
        // (NF-MATH-04/06): off-grid bases move strictly in-direction.
        const nextVal = cleanFloat(Math.max(min, stepLatticeInDirection(base, -1, step, factor)))
        if (nextVal === value) return
        // NF-DYNAMIC-05: steps are requests — the echo path recognizes the
        // echo (holds survive their own ticks; only unrelated replacements
        // advance the replacement generation).
        lastLiveRef.current = nextVal
        requestValue(nextVal)
      },
      [value, min, max, step, stepBase, disabled, readOnly, requestValue]
    )

    const handleInputChange = React.useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        // NF-EDIT-17/18: one swallow for stale composition fallout after
        // an authoritative replacement — the DOM node reverts to
        // controlled text, since no state change (and no callback) follows.
        if (compositionFalloutRef.current && !composingRef.current) {
          compositionFalloutRef.current = false
          const controlled = draftRef.current ?? displayValue
          if (e.target.value !== controlled) {
            e.target.value = controlled
          }
          return
        }
        // A new user edit supersedes any retained failed/pending boundary
        // (NF-COMMIT-07); the verbatim text stages the dirty session.
        clearTransientFailures()
        const text = e.target.value
        setDraft(text)
        // NF-EDIT-11: mid-composition input stages the buffer verbatim but
        // never publishes — not even a parseable final-looking string.
        if (composingRef.current) return
        // NFLAST ruling (c) live requests (NF-EDIT-03/04/05): a newly
        // parseable meaning is requested immediately — raw, never
        // clamped/snapped/rounded (those are commit-time, NF-COMMIT-05).
        // Incomplete grammar stays silent; repeated meanings dedupe
        // against both the controlled value and the latest request.
        if (text.trim() === '') {
          if (value !== null && lastLiveRef.current !== null) {
            lastLiveRef.current = null
            requestValue(null)
          }
          return
        }
        const parsed = parseDraftNumber(text, symbols, percentStyle)
        if (Number.isNaN(parsed)) return
        const canonical = Object.is(parsed, -0) ? 0 : parsed
        if (canonical === value || canonical === lastLiveRef.current) return
        lastLiveRef.current = canonical
        requestValue(canonical)
      },
      [clearTransientFailures, value, symbols, percentStyle, requestValue, displayValue]
    )

    // NF-EDIT-11 composition session: start suspends live publish, end
    // only lifts the suspension — the staged buffer commits at the next
    // boundary (synthetic final event carries no text of its own), while
    // a real post-end input event publishes through the ordinary path
    // with lastLiveRef dedupe guarding the double-publish.
    const handleCompositionStart = React.useCallback(() => {
      composingRef.current = true
      // A fresh session supersedes any armed fallout swallow or cancel.
      compositionFalloutRef.current = false
      compositionCancelRef.current = false
      compositionSnapshotRef.current = draftRef.current
    }, [])
    const handleCompositionEnd = React.useCallback(() => {
      // NF-DYNAMIC-05: a cancelled session ignores its stale end — the
      // buffer after cancellation is fresh user state, never restored.
      if (compositionCancelRef.current) {
        compositionCancelRef.current = false
        composingRef.current = false
        compositionSnapshotRef.current = null
        return
      }
      composingRef.current = false
      const snapshot = compositionSnapshotRef.current
      compositionSnapshotRef.current = null
      // NF-EDIT-12: a non-empty unparseable final result restores
      // pre-composition text immediately (null snapshot = was clean).
      // Valid finals and empties keep the staged buffer for the next
      // boundary; empties commit null there.
      const final = draftRef.current
      if (
        final !== null &&
        final !== '' &&
        Number.isNaN(parseDraftNumber(final, symbols, percentStyle))
      ) {
        setDraft(snapshot)
      }
    }, [symbols, percentStyle])

    // Commit outcome for submit handling: 'requested' means the parent has
    // not echoed yet (submit must wait for an explicit retry), 'failed'
    // records a boundary that blocks every later submit, 'noop' leaves the
    // already-canonical hidden state submittable.
    const runCommit = React.useCallback(
      (text: string): 'requested' | 'failed' | 'noop' => {
        // The session ends optimistically: accepted commits echo through
        // the controlled prop, rejected ones snap back to controlled state,
        // and invalid text reverts — all without a request for no-change.
        // The ref clears synchronously (mirroring onReset): Firefox runs
        // implicit submit inside the Enter-keydown default action, before
        // React flushes — a render-only clear lets onSubmit re-commit the
        // same draft and double-publish onChange (NF-FORM-12/EDIT-14/
        // COMMIT-02/COMP-01). The submit listener still blocks via the
        // pending/failed refs, so no submit behavior changes.
        setDraft(null)
        draftRef.current = null
        // Per-session live dedupe: the session ends, so the next session
        // re-requests from control even for a repeated meaning.
        lastLiveRef.current = value
        if (text.trim() === '') {
          // FEATURES #2: clearing an already-empty field is no change.
          if (value === null) return 'noop'
          requestValue(null)
          return 'requested'
        }
        const parsed = parseDraftNumber(text, symbols, percentStyle, { allowOrphanHead: true })
        // Invalid/incomplete text reverts without a numeric substitute and
        // records a failed boundary (NF-COMMIT-03/07).
        if (Number.isNaN(parsed)) {
          setFailedBoundary(true)
          return 'failed'
        }
        // NFLAST ruling (b): validate retains and reports — request the
        // rounded raw candidate as-is (never snap, never clamp); managed
        // invalid state derives from the controlled value and blocks submit.
        // onInvalidCommit is advisory: it fires after the onChange request
        // when the committed candidate violates constraints, range-first.
        // Violation is judged on the committed (rounded) candidate, so a
        // rounding that lands valid stays silent.
        if (commitBehavior === 'validate') {
          const accepted = displayRoundTrip(parsed)
          const canonical = Object.is(accepted, -0) ? 0 : accepted
          // FEATURES #2: committing the current value is no change.
          if (canonical === value) return 'noop'
          requestValue(canonical)
          if (canonical < min || canonical > max) {
            onInvalidCommit?.(canonical, 'out-of-range')
          } else if (!isOnStepLattice(canonical, step)) {
            onInvalidCommit?.(canonical, 'off-step')
          }
          return 'requested'
        }
        // NFLAST ruling (a) snap order (NF-MATH-12): endpoint-preservation
        // or nearest lattice, then authored rounding, then final clamp — one
        // request, never an invalid-commit report.
        if (commitBehavior === 'snap') {
          const snapped = snapValueToLattice(parsed, latticeMin, latticeMax, step)
          const accepted = displayRoundTrip(snapped)
          const clamped = Math.max(min, Math.min(max, accepted))
          const canonical = Object.is(clamped, -0) ? 0 : clamped
          // FEATURES #2: committing the current value is no change.
          if (canonical === value) return 'noop'
          requestValue(canonical)
          return 'requested'
        }
        const clamped = Math.max(min, Math.min(max, parsed))
        // FEATURES #2: committing the current value is no change.
        if (clamped === value) return 'noop'
        requestValue(clamped)
        return 'requested'
      },
      [
        value,
        min,
        max,
        latticeMin,
        latticeMax,
        step,
        symbols,
        percentStyle,
        commitBehavior,
        displayRoundTrip,
        requestValue,
        onInvalidCommit,
        setFailedBoundary,
      ]
    )
    const runCommitRef = React.useRef(runCommit)
    runCommitRef.current = runCommit

    const commitDraft = React.useCallback(() => {
      if (draftRef.current === null) return
      runCommit(draftRef.current)
    }, [runCommit])

    // NF-EDIT-08/09 + NF-PARSE-07: paste validates in NATIVE
    // beforeinput/ paste listeners — never React's onBeforeInput, which
    // React derives from keypress/textInput/paste/compositionend and
    // never feeds the native beforeinput event (verified in the
    // react-dom bundle: onBeforeInput registers compositionend,
    // keypress, textInput, paste). Native ordering gives the SPEC order
    // for free: every consumer paste observer (paste phase) runs before
    // this beforeinput validation, and a consumer paste/beforeinput
    // veto cancels the insertion natively before we ever run. The paste
    // listener only stashes the payload (failing open on unreadable
    // clipboards, NF-EDIT-10); only beforeinput ever prevents.
    const pasteStashRef = React.useRef<string | null>(null)
    const groupingDisabled = resolvedFormat.useGrouping === false
    const handleBeforeInput = React.useCallback(
      (e: Event) => {
        const native = e as InputEvent
        // Paste and ordinary typing validate here; compositional and
        // deletion insertions stay fully native (NF-EDIT-11).
        if (native.inputType !== 'insertFromPaste' && native.inputType !== 'insertText') return
        if (disabled || readOnly) return
        // Mid-composition insertions land natively and stage verbatim
        // via the ordinary input path (NF-EDIT-11: never mid-session).
        if (composingRef.current) return
        // Authoritative insert text first, native paste stash second;
        // unreadable either way fails open (NF-EDIT-10).
        const payload = (typeof native.data === 'string' ? native.data : null) ?? pasteStashRef.current
        pasteStashRef.current = null
        if (payload === null) return
        const node = e.currentTarget as HTMLInputElement | null
        if (!node) return
        let start: number
        let end: number
        try {
          start = node.selectionStart ?? node.value.length
          end = node.selectionEnd ?? node.value.length
        } catch {
          return
        }
        const current = node.value
        // NF-EDIT-02 tendency gate: ordinary typed insertions cancel
        // only the impossible — letters (other than one well-placed
        // exponent e), a duplicate decimal, a second/misplaced sign.
        // Valid partials ("-", "1.", "1e") always stage verbatim.
        if (native.inputType === 'insertText') {
          if (isImpossibleInsertion(current, start, end, payload, symbols)) {
            e.preventDefault()
          }
          return
        }
        // NF-PARSE-07: grouping-disabled fields strip pasted group
        // tokens — the number and caret model survive, separators go.
        let insert = payload
        if (groupingDisabled && symbols.group !== null && insert.includes(symbols.group)) {
          insert = insert.split(symbols.group).join('')
        }
        const spliced = current.slice(0, start) + insert + current.slice(end)
        // Strict live grammar (NF-EDIT-09): letters, conflicting
        // affixes, malformed grouping, ambiguous punctuation, and
        // overflow prevent with zero mutation — text, selection,
        // control, and callbacks all stay.
        if (Number.isNaN(parseDraftNumber(spliced, symbols, percentStyle))) {
          e.preventDefault()
          return
        }
        if (insert === payload) return
        // Stripped payload: native landing would insert the separators,
        // so apply the ungrouped splice through a real input event
        // (consumer input observers still run in native order) with the
        // caret after the inserted text.
        e.preventDefault()
        setNativeInputValue(node, spliced)
        node.dispatchEvent(new Event('input', { bubbles: true }))
        const caret = start + insert.length
        try {
          node.setSelectionRange(caret, caret)
        } catch {
          // ignore if not supported
        }
      },
      [disabled, readOnly, symbols, percentStyle, groupingDisabled]
    )
    useIsomorphicLayoutEffect(() => {
      const node = inputRef.current
      if (!node) return
      const stash = (e: Event) => {
        try {
          pasteStashRef.current = (e as ClipboardEvent).clipboardData?.getData('text') ?? null
        } catch {
          pasteStashRef.current = null
        }
      }
      node.addEventListener('paste', stash)
      node.addEventListener('beforeinput', handleBeforeInput)
      return () => {
        node.removeEventListener('paste', stash)
        node.removeEventListener('beforeinput', handleBeforeInput)
      }
    }, [inputRef, handleBeforeInput])

    const handleKeyDown = React.useCallback(
      (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (disabled || readOnly) return
        // Synthetic/IME composition suspends stepping and commit (NF-EDIT-11):
        // the session's final input event carries the text; keys — including
        // Enter and arrows — stay native and unhandled until it ends.
        if (e.nativeEvent?.isComposing) return
        const factor = e.shiftKey ? 10 : 1

        if (e.key === 'ArrowUp') {
          // Alt/Ctrl/Meta-modified arrows stay native (NF-KEY-03).
          if (e.altKey || e.ctrlKey || e.metaKey) return
          e.preventDefault()
          increment(factor)
        } else if (e.key === 'ArrowDown') {
          if (e.altKey || e.ctrlKey || e.metaKey) return
          e.preventDefault()
          decrement(factor)
        } else if (e.key === 'Home') {
          // Home/End target supplied bounds only when unmodified (NF-KEY-04).
          if (e.altKey || e.shiftKey || e.ctrlKey || e.metaKey) return
          if (min === -Infinity) return
          e.preventDefault()
          setDraft(null)
          // FEATURES #2: already at the bound is no change — the key
          // stays handled (caret pinned) but emits nothing.
          if (value === min) return
          requestValue(min)
        } else if (e.key === 'End') {
          if (e.altKey || e.shiftKey || e.ctrlKey || e.metaKey) return
          if (max === Infinity) return
          e.preventDefault()
          setDraft(null)
          // FEATURES #2: already at the bound is no change — the key
          // stays handled (caret pinned) but emits nothing.
          if (value === max) return
          requestValue(max)
        } else if (e.key === 'Enter') {
          // Enter commits the draft in place (no blur): invalid text
          // reverts, valid text publishes once. A clean field is untouched
          // and the key stays native for form submission.
          if (draftRef.current !== null && !e.altKey && !e.ctrlKey && !e.metaKey) {
            commitDraft()
          }
        }
      },
      [disabled, readOnly, increment, decrement, commitDraft, value, min, max, requestValue]
    )

    // Default composition (children omitted): a complete Group with
    // component-authored English stepper names. Consumer-authored steppers
    // must carry their own aria-label | aria-labelledby (PATCHES §6).
    const effectiveChildren =
      children ?? (
        <NumberFieldGroup>
          <NumberFieldDecrement aria-label="Decrement" />
          <NumberFieldInput />
          <NumberFieldIncrement aria-label="Increment" />
        </NumberFieldGroup>
      )

    // Stable generated Input id (NF-DOM-07, NF-ENV-03): pinned across
    // renders (the React 17 CT shim mints a fresh useId per render —
    // Splitter/Collapsible precedent), unique within the React root.
    const rawGeneratedId = React.useId().replace(/:/g, '')
    const pinnedGeneratedIdRef = React.useRef<string | null>(null)
    if (pinnedGeneratedIdRef.current === null) {
      pinnedGeneratedIdRef.current = rawGeneratedId
    }
    const { inputId, explicit: explicitInputId } = directInputId(
      effectiveChildren,
      `nf-${pinnedGeneratedIdRef.current}`
    )

    // NF-ENV-02: first render runs pre-commit, while the DOM still holds
    // server HTML under hydration (or nothing under a client render) —
    // the only moment the SSR text is observable. A pure read; the mount
    // effect validates node identity (cross-root id twins are rejected).
    if (!icuCaptureDoneRef.current && typeof document !== 'undefined') {
      icuCaptureDoneRef.current = true
      try {
        const candidate = document.getElementById(inputId)
        if (
          typeof HTMLInputElement !== 'undefined' &&
          candidate instanceof HTMLInputElement
        ) {
          const attr = candidate.getAttribute('value')
          if (attr !== null) icuCaptureRef.current = { node: candidate, text: attr }
        }
      } catch {
        // ignore if not supported
      }
    }

    // Root anatomy validation (NF-DOM-03, render phase): exactly one direct
    // Group. Anything else throws a part-specific diagnostic before any
    // listener, timer, hidden host, or callback exists.
    const groupCount = React.Children.toArray(effectiveChildren).filter(child =>
      isNumberFieldPart(child, NumberFieldGroup)
    ).length
    if (groupCount === 0) {
      throw new Error(
        'Reference UI: NumberField requires exactly one direct <NumberField.Group> wrapping its parts — none was found.'
      )
    }
    if (groupCount > 1) {
      throw new Error(
        `Reference UI: NumberField requires exactly one direct <NumberField.Group> but found ${groupCount} — no DOM-order authority is chosen.`
      )
    }

    // Independent SSR roots without distinct identifierPrefix values (or
    // explicit Input ids) can mint colliding generated ids: diagnose the
    // unsupported deployment instead of promising global uniqueness
    // (NF-ENV-04). The count is per owner root (NF-ENV-06): shadow-scoped
    // ids collide only within their own root, never the document.
    useIsomorphicLayoutEffect(() => {
      if (explicitInputId || typeof document === 'undefined') return
      let matches = 0
      try {
        const root =
          (inputRef.current?.getRootNode() as Document | ShadowRoot | undefined) ?? document
        matches = root.querySelectorAll(`[id="${inputId}"]`).length
      } catch {
        return
      }
      if (matches > 1) {
        numberFieldDevDiagnostic(
          `generated Input id "${inputId}" collides across independent roots — use distinct identifierPrefix values or explicit Input ids.`
        )
      }
    }, [inputId, explicitInputId])

    // NF-ENV-02: server/client Intl/CLDR/ICU mismatch is an unsupported
    // deployment — reported once through the dev channel, never thrown,
    // and never a promise that arbitrary ICU versions produce equal
    // bytes. The SSR text is captured during first render (pre-commit
    // DOM read keyed by the deterministic inputId — post-commit React
    // has already patched the node); the mount effect compares only
    // when hydration adopted that exact node. Pure client renders and
    // byte-identical hydrates stay silent; later text changes are user
    // edits, never deployment evidence.
    const icuMismatchLoggedRef = React.useRef(false)
    useIsomorphicLayoutEffect(() => {
      if (icuMismatchLoggedRef.current) return
      const capture = icuCaptureRef.current
      icuCaptureRef.current = null
      if (!capture || capture.node !== inputRef.current) return
      if (capture.text === displayValue) return
      icuMismatchLoggedRef.current = true
      numberFieldDevDiagnostic(
        `server-rendered text ${JSON.stringify(capture.text)} does not match the client Intl format ` +
          `${JSON.stringify(displayValue)} — the server and client Intl/CLDR/ICU data differ, ` +
          `which is an unsupported deployment; arbitrary ICU versions are not promised identical bytes.`
      )
    }, [displayValue, draft])

    // Native submit/reset observation (PATCHES §5): resolved through the
    // owned inputs' .form so lookup stays scoped to the owner tree (open
    // ShadowRoot included — never document-global). Every dirty field
    // processes the same submit independently: listeners never
    // short-circuit on defaultPrevented (NF-FORM-13).
    const submitStateRef = React.useRef({ readOnly, ownedInvalid })
    submitStateRef.current = { readOnly, ownedInvalid }
    React.useEffect(() => {
      const formElement = hiddenRef.current?.form ?? inputRef.current?.form ?? null
      if (!formElement) return
      const onSubmit = (e: Event) => {
        const state = submitStateRef.current
        // Read-only fields serialize canonical state without numeric
        // blocking; disabled fields are omitted natively.
        if (state.readOnly) return
        const dirty = draftRef.current
        if (dirty !== null) {
          // Still-dirty at submit: process the commit once (NF-FORM-06/07).
          // A completed request needs an explicit retry after the echo; a
          // failed boundary persists; only a true noop (hidden already
          // canonical, field otherwise valid) lets the submit through.
          const outcome = runCommitRef.current(dirty)
          if (
            outcome === 'noop' &&
            !failedBoundaryRef.current &&
            !state.ownedInvalid &&
            !pendingRequestRef.current
          ) {
            return
          }
          e.preventDefault()
          return
        }
        if (failedBoundaryRef.current || pendingRequestRef.current || state.ownedInvalid) {
          e.preventDefault()
        }
      }
      const onReset = (e: Event) => {
        // An application-cancelled reset leaves the active session exactly
        // intact; propagate nothing.
        if (e.defaultPrevented) return
        setDraft(null)
        draftRef.current = null
        pendingRequestRef.current = false
        setFailedBoundary(false)
        setResetEpoch(epoch => epoch + 1)
      }
      formElement.addEventListener('submit', onSubmit)
      formElement.addEventListener('reset', onReset)
      return () => {
        formElement.removeEventListener('submit', onSubmit)
        formElement.removeEventListener('reset', onReset)
      }
    }, [name, form, setFailedBoundary])

    // Post-reset sync (NF-FORM-08/14): native reset clobbers controlled
    // input DOM values behind React's back, so re-sync both owned inputs
    // from controlled state after every unprevented reset. Focus never
    // moves (programmatic reset keeps it, clicked reset already blurred);
    // a still-focused Input gets its caret at the formatted end. Reset
    // never changes the controlled number or application custom validity.
    const postResetSyncRef = React.useRef({ displayValue, canonicalHiddenValue })
    postResetSyncRef.current = { displayValue, canonicalHiddenValue }
    const firstResetSyncRef = React.useRef(true)
    useIsomorphicLayoutEffect(() => {
      if (firstResetSyncRef.current) {
        firstResetSyncRef.current = false
        return
      }
      // Per-session live dedupe resets to control with the reset session end.
      lastLiveRef.current = valueRef.current
      const sync = postResetSyncRef.current
      const input = inputRef.current
      if (input) {
        input.value = sync.displayValue
        // NF-ENV-06: focus ownership reads from the owner root (a shadow
        // input is never document.activeElement).
        const root = input.getRootNode() as Document | ShadowRoot
        if (root.activeElement === input) {
          try {
            input.setSelectionRange(sync.displayValue.length, sync.displayValue.length)
          } catch {
            // ignore if not supported
          }
        }
      }
      if (hiddenRef.current) hiddenRef.current.value = sync.canonicalHiddenValue
    }, [resetEpoch])

    const contextValue = React.useMemo<NumberFieldContextValue>(
      () => ({
        value,
        displayValue,
        min,
        max,
        step,
        disabled,
        readOnly,
        required,
        invalid: managedInvalid,
        inputMode: managedInputMode,
        inputId,
        draft,
        stepBase,
        resetEpoch,
        replacementEpoch,
        increment,
        decrement,
        handleInputChange,
        handleCompositionStart,
        handleCompositionEnd,
        handleKeyDown,
        commitDraft,
        inputRef,
        focusInput,
      }),
      [
        value,
        displayValue,
        min,
        max,
        step,
        disabled,
        readOnly,
        required,
        managedInvalid,
        managedInputMode,
        inputId,
        draft,
        stepBase,
        resetEpoch,
        replacementEpoch,
        increment,
        decrement,
        handleInputChange,
        handleCompositionStart,
        handleCompositionEnd,
        handleKeyDown,
        commitDraft,
        focusInput,
      ]
    )

    const empty = draft !== null ? draft === '' : value === null

    // NF-EDIT-07 pre-commit capture: while the DOM still holds the outgoing
    // text, remember it with the live selection. A pure read (no writes),
    // refreshed on every focused render, so the replacing render always
    // carries the true pre-replacement caret — including programmatic
    // setSelectionRange placements, which fire no event to observe.
    {
      const node = inputRef.current
      if (node) {
        try {
          const root = node.getRootNode() as Document | ShadowRoot
          if (root.activeElement === node) {
            caretCaptureRef.current = {
              text: node.value,
              start: node.selectionStart ?? node.value.length,
              end: node.selectionEnd ?? node.value.length,
            }
          }
        } catch {
          // ignore if not supported
        }
      }
    }

    return (
      <NumberFieldContext.Provider value={contextValue}>
        {/* Consumer props spread first: managed data authority defeats
            forged casts (NF-DOM-06); unrelated props and StyleProps pass
            through (NF-DOM-05). The root is a plain host — Group owns the
            role, bezel markers, and focus-visible integration. */}
        <Div
          ref={ref}
          {...props}
          data-disabled={disabled ? '' : undefined}
          data-readonly={readOnly ? '' : undefined}
          data-required={required ? '' : undefined}
          data-invalid={managedInvalid ? '' : undefined}
          data-empty={empty ? '' : undefined}
          data-editing={draft !== null ? '' : undefined}
          className={className}
          style={style}
        >
          {effectiveChildren}
          {/* Hidden canonical form input (NF-DOM-02, NF-FORM-01): exactly
              one root-direct input[type=hidden] when name is set. It has no
              public part or ref, carries canonical String(value), mirrors
              disabled, and never validates (no number proxy). readOnly
              silences the controlled-input warning; it changes nothing
              about submission. */}
          {name ? (
            <input
              ref={hiddenRef}
              type="hidden"
              name={name}
              form={form}
              value={canonicalHiddenValue}
              disabled={disabled}
              readOnly
            />
          ) : null}
        </Div>
      </NumberFieldContext.Provider>
    )
  }
) as React.ForwardRefExoticComponent<NumberFieldProps & React.RefAttributes<HTMLDivElement>> & {
  Group: typeof NumberFieldGroup
  Input: typeof NumberFieldInput
  Increment: typeof NumberFieldIncrement
  Decrement: typeof NumberFieldDecrement
}

NumberField.Group = NumberFieldGroup
NumberField.Input = NumberFieldInput
NumberField.Increment = NumberFieldIncrement
NumberField.Decrement = NumberFieldDecrement

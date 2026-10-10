/**
 * The locale draft parser (W-25): ASCII plus active-numbering-system
 * digits, configured currency/unit/percent affixes in locale order,
 * locale group/decimal normalization, a single leading sign, and an
 * optional localized exponent. Percent style scales per React Aria.
 * Anything else — foreign digits/affixes/punctuation, malformed
 * grouping, ambiguous punctuation — returns NaN, never a guess. The
 * tendency gate (isImpossibleInsertion) cancels only the impossible at
 * keystroke time so valid partials always stage. Pure, proven by its
 * colocated suite.
 */
import {
  DRAFT_MINUS_VARIANTS,
  DRAFT_PERMILLE_MARKS,
  DRAFT_PLUS_VARIANTS,
  normalizeDraftDigits,
  type DraftNumberSymbols,
} from './symbols'

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

export function isValidGroupHead(segments: string[], sizes: { units: number; middle: number }): boolean {
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

// NF-EDIT-02 tendency gate: a typed insertion is impossible (canceled)
// iff the typed text introduces a letter other than one well-placed
// exponent e/E, a duplicate decimal separator, or a second/misplaced
// sign. Digits, group separators, and valid partials always stage.
export function isImpossibleInsertion(
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

export function parseDraftNumber(
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

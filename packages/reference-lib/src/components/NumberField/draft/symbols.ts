/**
 * The locale's draft alphabet: group and decimal separators, the ten
 * positional digit glyphs of the resolved numbering system, active-locale
 * signs, group-size patterns, configured affixes in locale order, the
 * accounting rule, and the localized exponent separator. Everything is
 * derived from Intl probes at construction — never tabled — and systems
 * without ten stable positional digits fail before accepting edits.
 * Proven by its colocated suite.
 */

export interface DraftNumberSymbols {
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
export const HANIDEC_DIGITS = '〇一二三四五六七八九'

export function draftDigits(locale: string, numberingSystem?: string): string {
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

export function draftNumberSymbols(locale: string, formatOptions?: Intl.NumberFormatOptions): DraftNumberSymbols {
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
export const DRAFT_AFFIX_PROBE_VALUES = [0, 1, 2, 3, 5, 11, 100, 1234.5]

// Permille marks (NF-PARSE-09): Intl never emits them, but percent style
// scales U+2030 (and the Arabic-indic U+0609) by 1/1000 per React Aria.
export const DRAFT_PERMILLE_MARKS = ['\u2030', '\u0609']

export function draftAffixes(
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

export function draftGroupSizes(locale: string): { units: number; middle: number } {
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
export const DRAFT_PLUS_VARIANTS = ['＋', '﹢']
export const DRAFT_MINUS_VARIANTS = ['－', '﹣']

// Shallow format-options equality ported from React Spectrum's
// useNumberFieldState: every Intl.NumberFormatOptions member is a primitive,
// so a referentially new but effectively equal object must not reset state.
export function isEqualFormatOptions(
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

// Digit normalization (NF-PARSE-02/15): ASCII always parses; active-system
// glyphs map to their positional value; any other decimal digit — a second
// non-ASCII script or inactive-locale digits — rejects the whole text.
export function normalizeDraftDigits(text: string, digits: string): string | null {
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

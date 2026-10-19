// Rhythm lowering for `r` units: an exact port of the Rust compiler's atomic resolve/rhythm, so extendSystem and
// the generated getRhythm print what the compiler prints. It takes a CSS value, or one rhythm word such as `r`,
// `2r`, `-1/3r` or `.5r`, and emits `var(--spacing-root)` or a `calc()` over it; a word that is not a finite
// rhythm unit passes through as written. getRhythm is emitted as source text into the generated entry, so its
// body names only JS globals and no module-level binding.

/** The custom property every rhythm unit multiplies. */
export const SPACING_ROOT_VAR = '--spacing-root'

/**
 * The CSS for `num` rhythm units, over `denom` when one is given. It is emitted by `toString()`, so the body
 * names only JS globals: the number formatter and the one-unit checks are nested for that reason.
 */
export const getRhythm = (num: number, denom?: number): string => {
  // Rust's `{}` for a finite f64: shortest round-trip digits, never an exponent, and `-0` kept.
  const fmt = (n: number): string => {
    if (Object.is(n, -0)) return '-0'
    const text = String(n)
    if (!text.includes('e')) return text
    const [mantissa, exponent] = String(Math.abs(n)).split('e')
    const [whole, fraction = ''] = mantissa.split('.')
    const digits = whole + fraction
    const point = whole.length + Number(exponent)
    const sign = n < 0 ? '-' : ''
    if (point <= 0) return `${sign}0.${'0'.repeat(-point)}${digits}`
    if (point >= digits.length) return `${sign}${digits}${'0'.repeat(point - digits.length)}`
    return `${sign}${digits.slice(0, point)}.${digits.slice(point)}`
  }
  const isOne = (x: number): boolean => Math.abs(x - 1) < Number.EPSILON
  const isNegOne = (x: number): boolean => Math.abs(x + 1) < Number.EPSILON
  if (denom !== undefined) {
    if (isOne(num)) return `calc(var(--spacing-root) / ${fmt(denom)})`
    if (isNegOne(num)) return `calc(-1 * var(--spacing-root) / ${fmt(denom)})`
    return `calc(${fmt(num)} * var(--spacing-root) / ${fmt(denom)})`
  }
  if (isOne(num)) return 'var(--spacing-root)'
  if (isNegOne(num)) return 'calc(-1 * var(--spacing-root))'
  return `calc(${fmt(num)} * var(--spacing-root))`
}

// A finite decimal spelling: an optional sign, digits with an optional fraction (or a leading-dot fraction),
// then an optional exponent. The named spellings are not in this grammar, so they refuse here.
const DECIMAL = /^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?$/

// The stem's value when it is a finite decimal: an overflowing spelling parses to Infinity and refuses.
function finiteDecimal(text: string): number | undefined {
  if (!DECIMAL.test(text)) return undefined
  const value = Number(text)
  return Number.isFinite(value) ? value : undefined
}

// `num/denom` with exactly one slash that does not lead, both sides finite, and a denominator that is not zero.
function lowerFraction(stem: string): string | undefined {
  const slash = stem.indexOf('/')
  if (slash === 0 || slash !== stem.lastIndexOf('/')) return undefined
  const num = finiteDecimal(stem.slice(0, slash))
  const denom = finiteDecimal(stem.slice(slash + 1))
  if (num === undefined || denom === undefined || denom === 0) return undefined
  return getRhythm(num, denom)
}

/**
 * One rhythm word as CSS: an empty stem or `+` is one unit, `-` is minus one, and any other stem is a finite
 * decimal or a fraction. Undefined when the word is not a finite rhythm unit.
 */
export function lowerRhythmWord(word: string): string | undefined {
  if (!word.endsWith('r')) return undefined
  const stem = word.slice(0, -1)
  if (stem === '' || stem === '+') return getRhythm(1)
  if (stem === '-') return getRhythm(-1)
  if (stem.includes('/')) return lowerFraction(stem)
  const num = finiteDecimal(stem)
  return num === undefined ? undefined : getRhythm(num)
}

// Unicode White_Space as code point ranges: U+0009 to U+000D, U+0020, U+0085, U+00A0, U+1680, U+2000 to U+200A,
// U+2028, U+2029, U+202F, U+205F and U+3000. The ranges are spelled out, not taken from a regex class, because
// `\s` also takes U+FEFF.
const WHITE_SPACE: readonly (readonly [number, number])[] = [
  [0x09, 0x0d],
  [0x20, 0x20],
  [0x85, 0x85],
  [0xa0, 0xa0],
  [0x1680, 0x1680],
  [0x2000, 0x200a],
  [0x2028, 0x2029],
  [0x202f, 0x202f],
  [0x205f, 0x205f],
  [0x3000, 0x3000],
]

// The punctuation delimiters beside whitespace. `/` and signs stay inside words, so `1/3r` and `-2r` survive.
const PUNCTUATION_DELIMITERS = '(),*'

function isDelimiter(ch: string): boolean {
  const code = ch.charCodeAt(0)
  return PUNCTUATION_DELIMITERS.includes(ch) || WHITE_SPACE.some(([lo, hi]) => code >= lo && code <= hi)
}

// Words and single delimiter characters, in order: each separator is kept as its own fragment.
function splitFragments(value: string): string[] {
  const fragments: string[] = []
  let word = ''
  for (const ch of value) {
    if (!isDelimiter(ch)) {
      word += ch
      continue
    }
    if (word !== '') fragments.push(word)
    fragments.push(ch)
    word = ''
  }
  if (word !== '') fragments.push(word)
  return fragments
}

// The functions whose bodies never resolve rhythm, matched without regard to case as the compiler does.
const PROTECTED_FUNCTION = /^(?:var|url|env)$/i

// The scan state: the output so far, the name each open paren opened under, and the last word. A paren takes
// the last word as its name even across a closed `)` and a space, which is the compiler's behaviour.
interface RhythmScan {
  out: string
  open: (string | undefined)[]
  pending: string | undefined
}

function isProtectedName(name: string | undefined): boolean {
  return name !== undefined && PROTECTED_FUNCTION.test(name)
}

function scanFragment(scan: RhythmScan, fragment: string): void {
  if (fragment === '(') {
    scan.open.push(scan.pending)
    scan.pending = undefined
    scan.out += fragment
  } else if (fragment === ')') {
    scan.open.pop()
    scan.out += fragment
  } else if (isDelimiter(fragment.charAt(0))) {
    scan.out += fragment
  } else {
    scan.pending = fragment
    scan.out += scan.open.some(isProtectedName) ? fragment : (lowerRhythmWord(fragment) ?? fragment)
  }
}

/**
 * Lowers every rhythm word in a CSS value and keeps every other character. A word inside `var()`, `url()` or
 * `env()` at any depth stays literal, and a value with no `r` is returned as it is.
 */
export function lowerRhythm(value: string): string {
  if (!value.includes('r')) return value
  const scan: RhythmScan = { out: '', open: [], pending: undefined }
  for (const fragment of splitFragments(value)) scanFragment(scan, fragment)
  return scan.out
}

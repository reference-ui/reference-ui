/**
 * Shorthand procedures P4-P6: token split, border classification, whole-value gates.
 * Mirrors `resolve/shorthands/parser.rs` (P4 `split_tokens`, P5
 * `parse_shorthand_tokens` with the style-first first-wins order) and
 * `border.rs::expand_border_shorthand` (P6: the zero gate, the outline ring,
 * the whole keep, then the trio fan-out). Pins goldens `10-splitTokens`,
 * `11-classifyBorder`, and `12-expandBorder`. Keyword sets and trio
 * longhands come from the shipped tables; nothing is hand-copied.
 */
import type { LowerStep, NamerGuard, NamerTables } from '../../../../contracts/types.js'
import { asciiLower, isDecimalSpelling, trimStructural } from './lexical.js'
import { canonicalProp } from './value.js'

/** Width/style/color classification with nulls for absent parts. */
export interface BorderClassification {
  width: string | null
  style: string | null
  color: string | null
}

/**
 * P4: tokenize shorthand by whitespace, preserving nested parenthesized
 * expressions. Splits on exactly space, tab, and newline at depth zero;
 * whitespace inside parens flattens to one space per char.
 */
export function splitTokens(val: string): string[] {
  const splitter = new TokenSplitter()
  for (const ch of val) splitter.push(ch)
  return splitter.finish()
}

/** One tokenize pass: emitted tokens, the open token, and paren depth. */
class TokenSplitter {
  private tokens: string[] = []
  private current = ''
  private depth = 0

  /** Push one char: parens nest, top-level whitespace splits. */
  push(ch: string): void {
    if (ch === '(') this.openParen()
    else if (ch === ')') this.closeParen()
    else if (ch === ' ' || ch === '\t' || ch === '\n') this.pushWhitespace()
    else this.current += ch
  }

  /** Tokens with the trailing open token flushed. */
  finish(): string[] {
    if (this.current.length > 0) this.tokens.push(this.current)
    return this.tokens
  }

  /** Open one paren level. */
  private openParen(): void {
    this.depth += 1
    this.current += '('
  }

  /** Close one paren level, saturating at zero. */
  private closeParen(): void {
    this.depth = Math.max(0, this.depth - 1)
    this.current += ')'
  }

  /** Whitespace: flattened inside parens, splitting at depth zero. */
  private pushWhitespace(): void {
    if (this.depth > 0) this.current += ' '
    else if (this.current.length > 0) {
      this.tokens.push(this.current)
      this.current = ''
    }
  }
}

/**
 * P5 golden: parse space-separated tokens into width, style, and color.
 * Style keywords first (stored ASCII-folded, untrimmed), then length-widths,
 * else color; first of each kind wins and extras drop.
 */
export function classifyBorder(
  input: { tokens: string[]; outline: boolean },
  tables: NamerTables
): BorderClassification {
  return classifyTrioTokens(input.tokens, input.outline, tables)
}

/** P5 shared with the trio interpreter: classify with the family's style set. */
export function classifyTrioTokens(
  tokens: string[],
  outline: boolean,
  tables: NamerTables
): BorderClassification {
  const found: BorderClassification = { width: null, style: null, color: null }
  for (const token of tokens) assignTrioToken(found, token, outline, tables)
  return found
}

/** Assign one token by classification; first of each kind wins. */
function assignTrioToken(
  found: BorderClassification,
  token: string,
  outline: boolean,
  tables: NamerTables
): void {
  if (isStyleToken(token, outline, tables)) {
    if (found.style === null) found.style = asciiLower(token)
    return
  }
  if (isLengthWidth(token, tables)) {
    if (found.width === null) found.width = token
    return
  }
  if (found.color === null) found.color = token
}

/** True when the token names a style keyword for this shorthand family. */
function isStyleToken(token: string, outline: boolean, tables: NamerTables): boolean {
  const set = outline ? tables.keywords['outlineStyle'] : tables.keywords['borderStyle']
  return (set ?? []).includes(asciiLower(trimStructural(token)))
}

/** True for a length, line-width keyword, or math function. */
function isLengthWidth(token: string, tables: NamerTables): boolean {
  const s = asciiLower(trimStructural(token))
  if (s === 'r' || s === '+r' || s === '-r') return true
  if ((tables.keywords['lineWidth'] ?? []).includes(s)) return true
  if (isMathFunction(s, tables)) return true
  if (isNumberOrDimension(s, tables)) return true
  return isRhythmFraction(s)
}

/** True for a `calc(`/`min(`/`max(`/`clamp(` call. */
function isMathFunction(s: string, tables: NamerTables): boolean {
  if (!s.endsWith(')')) return false
  return (tables.keywords['mathFns'] ?? []).some(
    name => s.startsWith(name) && s.slice(name.length).startsWith('(')
  )
}

/** True for a number with an optional length-unit suffix. */
function isNumberOrDimension(s: string, tables: NamerTables): boolean {
  const units = tables.keywords['lengthUnits'] ?? []
  for (const unit of units) {
    if (s.endsWith(unit) && isValidNumeric(s.slice(0, s.length - unit.length))) return true
  }
  return isValidNumeric(s)
}

/** Ungated entry: non-finite parses classify as widths here. */
function isValidNumeric(s: string): boolean {
  if (s.length === 0) return false
  const rest = s.startsWith('+') || s.startsWith('-') ? s.slice(1) : s
  return rest.length > 0 && isDecimalSpelling(rest)
}

/** True for an `N/Mr` rhythm fraction. */
function isRhythmFraction(s: string): boolean {
  if (!s.endsWith('r')) return false
  const parts = s.slice(0, s.length - 1).split('/')
  return (
    parts.length === 2 &&
    parts[0] !== undefined &&
    parts[1] !== undefined &&
    isValidNumeric(parts[0]) &&
    isValidNumeric(parts[1])
  )
}

/** True when the trimmed value names a CSS-wide cascade keyword. */
export function isGlobalKeyword(trimmed: string, tables: NamerTables): boolean {
  return (tables.keywords['cssWide'] ?? []).includes(asciiLower(trimStructural(trimmed)))
}

/**
 * P6 border-family whole predicate: exact `none`, CSS-wide, `var()`, or
 * `borders.`/`outlines.` prefixes on the trimmed value, lowercased for test.
 */
export function isWholeBorderValue(trimmed: string, tables: NamerTables): boolean {
  const lower = asciiLower(trimmed)
  return (
    isGlobalKeyword(lower, tables) ||
    (lower.startsWith('var(') && lower.endsWith(')')) ||
    lower.startsWith('borders.') ||
    lower.startsWith('outlines.')
  )
}

/**
 * P6 golden: decompose one composite border or outline declaration into
 * atomic longhands. Reads the trio shape, the zero emit, and the outline
 * ring from the lowering table; null past the family gate or on empty input.
 */
export function expandBorder(
  input: { prop: string; value: string },
  tables: NamerTables
): { pairs: Array<[string, string]> } | null {
  const canon = canonicalProp(input.prop, tables)
  const steps = tables.lowerings[canon]
  const trio = steps?.find(isTrioStep)
  if (steps === undefined || trio === undefined) return null
  const trimmed = trimStructural(input.value)
  const gated = gatedPairs(canon, trimmed, steps, tables)
  if (gated !== undefined) return gated
  return splitTrioValue(trio, trimmed, tables)
}

/** Trio split-classify-build past the gates, null on empty. */
function splitTrioValue(
  trio: TrioStep,
  trimmed: string,
  tables: NamerTables
): { pairs: Array<[string, string]> } | null {
  const tokens = splitTokens(trimmed)
  if (tokens.length === 0) return null
  const parsed = classifyTrioTokens(tokens, trio.style === 'outline', tables)
  const pairs = buildTrioPairs(trio.longhands, parsed)
  return pairs.length === 0 ? null : { pairs }
}

/** Zero, ring, and whole gates; undefined falls through to the split. */
function gatedPairs(
  canon: string,
  trimmed: string,
  steps: LowerStep[],
  tables: NamerTables
): { pairs: Array<[string, string]> } | undefined {
  const zeroed = zeroEmitPairs(steps, trimmed, tables)
  if (zeroed !== undefined) return { pairs: zeroed }
  if (trimmed === 'none') {
    const ring = noneEmitPairs(steps)
    if (ring !== undefined) return { pairs: ring }
    return { pairs: [[canon, trimmed]] }
  }
  if (isWholeBorderValue(trimmed, tables)) return { pairs: [[canon, trimmed]] }
  return undefined
}

/** Trio fan-out lowering step, narrowed from the untagged wire union. */
export type TrioStep = {
  on?: NamerGuard
  longhands: [string, string, string]
  shape: 'trio'
  style: 'border' | 'outline'
}

/** True for a trio fan-out lowering step. */
function isTrioStep(step: LowerStep): step is TrioStep {
  return 'shape' in step && step.shape === 'trio'
}

/** Zero-gate emit pairs when the trimmed value is a closed zero spelling. */
function zeroEmitPairs(
  steps: LowerStep[],
  trimmed: string,
  tables: NamerTables
): Array<[string, string]> | undefined {
  if (!(tables.keywords['zeroBorder'] ?? []).includes(trimmed)) return undefined
  const zero = steps.find(
    step => 'emit' in step && step.on !== undefined && isInGuard(step.on, 'zeroBorder')
  )
  return zero !== undefined && 'emit' in zero ? zero.emit : undefined
}

/** Ring emit pairs when this family carries an `{eq:'none'}` step. */
function noneEmitPairs(steps: LowerStep[]): Array<[string, string]> | undefined {
  const ring = steps.find(
    step => 'emit' in step && step.on !== undefined && isEqGuard(step.on, 'none')
  )
  return ring !== undefined && 'emit' in ring ? ring.emit : undefined
}

/** True for an `{eq: want}` guard. */
function isEqGuard(on: NamerGuard | undefined, want: string): boolean {
  return on !== undefined && typeof on === 'object' && 'eq' in on && on.eq === want
}

/** True for an `{in: want}` guard. */
function isInGuard(on: NamerGuard | undefined, want: string): boolean {
  return on !== undefined && typeof on === 'object' && 'in' in on && on.in === want
}

/** Width/style/color pairs in emit order, skipping absent parts. */
function buildTrioPairs(
  longhands: [string, string, string],
  parsed: BorderClassification
): Array<[string, string]> {
  const pairs: Array<[string, string]> = []
  if (parsed.width !== null) pairs.push([longhands[0], parsed.width])
  if (parsed.style !== null) pairs.push([longhands[1], parsed.style])
  if (parsed.color !== null) pairs.push([longhands[2], parsed.color])
  return pairs
}

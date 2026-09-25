/**
 * TypeScript mirror of the reference-rs diagnostics template: one representation, one transport.
 * Takes napi JSON payloads (single diagnostics or batches) and validates the same contract Rust enforces.
 * Emits parsed diagnostics plus one-line rendering and the message-pattern helpers, so both sides of the
 * boundary construct, carry, and display identical values. Codes validate in `parseCode`, never in the type.
 */
import type { Diagnostic as GeneratedDiagnostic } from './generated/Diagnostic'
import type { Severity } from './generated/Severity'
import type { DiagnosticLocation } from './location'
import { parseLocation } from './location'

export type { Severity } from './generated/Severity'
export type { ByteSpan } from './generated/ByteSpan'
export type { Label } from './generated/Label'
export type { Diagnostic as GeneratedDiagnostic } from './generated/Diagnostic'
export { createLabel, createSpan, parseLocation } from './location'
export type { DiagnosticLocation } from './location'
export { MAX_FRAMES, renderBatch, renderFrame } from './render'

/** Wire code text (`NS-SEV-NAME`); validated by `parseCode`, not by the type. */
export type DiagnosticCode = string

/** Parsed diagnostic: the generated wire shape, guaranteed valid by construction or `parseDiagnostic`. */
export type Diagnostic = GeneratedDiagnostic

/** Namespace owned by the template itself; mirrors `TEMPLATE_NAMESPACE` in Rust. */
export const TEMPLATE_NAMESPACE = 'RS'

/**
 * Machine-readable copy of the REGISTRY.md namespace table; mirrors `REGISTERED_NAMESPACES`.
 * Advisory only: parsing stays shape-open so consumers keep reading newer codes.
 */
export const REGISTERED_NAMESPACES: readonly string[] = [
  'RS',
  'ATM',
  'ATL',
  'TST',
  'STT',
  'TGN',
  'CAN',
  'BSS',
  'MGP',
]

const CODE_PATTERN = /^([A-Z][A-Z0-9]{1,3})-([WE])-([A-Z0-9]+(?:-[A-Z0-9]+)*)$/
const MAX_CODE_LENGTH = 64

/** A payload that failed template validation, carrying the reason. */
export class DiagnosticParseError extends Error {
  override name = 'DiagnosticParseError'
}

/** Parse and validate a wire code; anything off-shape throws with the reason. */
export function parseCode(input: unknown): DiagnosticCode {
  if (typeof input !== 'string')
    throw new DiagnosticParseError('diagnostic code must be a string')
  if (input.length > MAX_CODE_LENGTH) {
    throw new DiagnosticParseError('diagnostic code exceeds 64 characters')
  }
  if (input.split('-')[1] === 'I') {
    throw new DiagnosticParseError(
      'severity tag `I` is reserved; the template carries warnings and errors only'
    )
  }
  if (!CODE_PATTERN.test(input)) {
    throw new DiagnosticParseError(`invalid diagnostic code: ${input}`)
  }
  return input
}

/** Namespace segment of a validated code, e.g. `ATM`. */
export function codeNamespace(code: DiagnosticCode): string {
  return code.split('-')[0]!
}

/** Severity tag a code was minted with: `W` or `E`. */
export function codeSeverityTag(code: DiagnosticCode): 'W' | 'E' {
  return code.split('-')[1] === 'E' ? 'E' : 'W'
}

/** Advisory check against the registry table; unregistered but well-shaped codes still parse. */
export function isRegisteredNamespace(code: DiagnosticCode): boolean {
  return REGISTERED_NAMESPACES.includes(codeNamespace(code))
}

/** Build a warning; throws `DiagnosticParseError` on a bad code, tag mismatch, or blank message. */
export function createWarning(
  code: string,
  message: string,
  location?: DiagnosticLocation
): Diagnostic {
  return createDiagnostic('warning', code, message, location)
}

/** Build an error; throws `DiagnosticParseError` on a bad code, tag mismatch, or blank message. */
export function createError(
  code: string,
  message: string,
  location?: DiagnosticLocation
): Diagnostic {
  return createDiagnostic('error', code, message, location)
}

function createDiagnostic(
  severity: Severity,
  code: string,
  message: string,
  location?: DiagnosticLocation
): Diagnostic {
  const parsed = parseCode(code)
  if (message.trim().length === 0) {
    throw new DiagnosticParseError('diagnostic message must not be blank')
  }
  const expected = severity === 'warning' ? 'W' : 'E'
  if (codeSeverityTag(parsed) !== expected) {
    throw new DiagnosticParseError(
      `code \`${parsed}\` carries \`-${codeSeverityTag(parsed)}-\` but severity is \`${expected}\``
    )
  }
  if (location === undefined) return { severity, code: parsed, message }
  return { severity, code: parsed, message, ...parseLocation(location) }
}

/** Parse one diagnostic from unknown input (object or JSON string), failing closed like Rust. */
export function parseDiagnostic(input: unknown): Diagnostic {
  const value = typeof input === 'string' ? parseJsonObject(input) : input
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new DiagnosticParseError('diagnostic must be an object')
  }
  const record = value as Record<string, unknown>
  const severity = parseSeverity(record.severity)
  const code = parseCode(record.code)
  if (typeof record.message !== 'string' || record.message.trim().length === 0) {
    throw new DiagnosticParseError('diagnostic message must not be blank')
  }
  const expected = severity === 'warning' ? 'W' : 'E'
  if (codeSeverityTag(code) !== expected) {
    throw new DiagnosticParseError(
      `code \`${code}\` carries \`-${codeSeverityTag(code)}-\` but severity is \`${expected}\``
    )
  }
  return { severity, code, message: record.message, ...parseLocation(record) }
}

/** Parse a batch from unknown input (array or JSON string); any bad row refuses the batch. */
export function parseBatch(input: unknown): Diagnostic[] {
  const value = typeof input === 'string' ? parseJson(input) : input
  if (!Array.isArray(value))
    throw new DiagnosticParseError('diagnostic batch must be an array')
  return value.map(parseDiagnostic)
}

function parseSeverity(input: unknown): Severity {
  if (input === 'warning' || input === 'error') return input
  throw new DiagnosticParseError('diagnostic severity must be `warning` or `error`')
}

function parseJson(input: string): unknown {
  try {
    return JSON.parse(input) as unknown
  } catch {
    throw new DiagnosticParseError('diagnostic batch is not valid JSON')
  }
}

function parseJsonObject(input: string): unknown {
  try {
    return JSON.parse(input) as unknown
  } catch {
    throw new DiagnosticParseError('diagnostic is not valid JSON')
  }
}

/**
 * Canonical wire record: the template fields in struct order (severity, code,
 * message, file, line, column, span, labels, help), unknown keys stripped,
 * absent optionals omitted, and empty label/help lists dropped like Rust.
 * Both js mirrors and the serde struct emit this order, so the same
 * diagnostic encodes to byte-identical JSON on either side of napi.
 */
export function toCanonicalRecord(diagnostic: Diagnostic): Diagnostic {
  const record: Diagnostic = {
    severity: diagnostic.severity,
    code: diagnostic.code,
    message: diagnostic.message,
  }
  if (diagnostic.file !== undefined) record.file = diagnostic.file
  if (diagnostic.line !== undefined) record.line = diagnostic.line
  if (diagnostic.column !== undefined) record.column = diagnostic.column
  if (diagnostic.span !== undefined) {
    record.span = { start: diagnostic.span.start, end: diagnostic.span.end }
  }
  if (diagnostic.labels !== undefined && diagnostic.labels.length > 0) {
    record.labels = diagnostic.labels.map(label => ({
      span: { start: label.span.start, end: label.span.end },
      message: label.message,
    }))
  }
  if (diagnostic.help !== undefined && diagnostic.help.length > 0) {
    record.help = [...diagnostic.help]
  }
  return record
}

/** Encode one diagnostic to its canonical wire JSON. */
export function encodeDiagnostic(diagnostic: Diagnostic): string {
  return JSON.stringify(toCanonicalRecord(diagnostic))
}

/** Encode a batch for transport; `parseBatch` of the result round-trips. */
export function encodeBatch(diagnostics: Diagnostic[]): string {
  return JSON.stringify(diagnostics.map(toCanonicalRecord))
}

/** Whether the diagnostic is a warning. */
export function isWarning(diagnostic: Diagnostic): boolean {
  return diagnostic.severity === 'warning'
}

/** Whether the diagnostic is an error. */
export function isError(diagnostic: Diagnostic): boolean {
  return diagnostic.severity === 'error'
}

/**
 * Render `{file}:{line}:{col} {code} {subject}` for one-line display (CLI rows, log lines).
 * Uses the message's first line only; unlocated diagnostics print just `{code} {subject}`.
 */
export function renderOneLine(diagnostic: Diagnostic): string {
  const subject = diagnostic.message.split('\n')[0] ?? diagnostic.message
  return `${locationPrefix(diagnostic)}${diagnostic.code} ${subject}`
}

/** Render location plus code plus the full multi-line message (verbose display, reports). */
export function renderFull(diagnostic: Diagnostic): string {
  return `${locationPrefix(diagnostic)}${diagnostic.code} ${diagnostic.message}`
}

function locationPrefix(diagnostic: Diagnostic): string {
  if (diagnostic.file === undefined) return ''
  if (diagnostic.line !== undefined && diagnostic.column !== undefined) {
    return `${diagnostic.file}:${diagnostic.line}:${diagnostic.column} `
  }
  return `${diagnostic.file} `
}

/** Wrap a code subject (token path, prop, file) in backticks: `` `colors.navy` ``. */
export function inlineCode(value: string): string {
  return `\`${value}\``
}

/** Append producer guidance as a trailing line: `hint: token paths are dotted pairs`. */
export function hint(text: string): string {
  return `hint: ${text}`
}

/** Suggest the closest known name: `` did you mean `colors.navy-500`? ``. */
export function didYouMean(known: string): string {
  return `did you mean \`${known}\`?`
}

/** Join message lines with newlines; line one stays the complete subject. */
export function joinLines(lines: string[]): string {
  return lines.join('\n')
}

/**
 * Codes whose failure is an unknown name drawn from a finite known set: the only codes
 * `suggestForCode` will suggest for. Mirrors the Rust gate exactly; opaque names and every
 * other failure class stay silent even when a candidate looks near.
 */
export const SUGGESTION_CODES: readonly string[] = [
  'ATM-W-UNKNOWN-PROPERTY',
  'ATM-W-UNKNOWN-BREAKPOINT',
  'ATM-W-UNKNOWN-CONDITION',
  'ATM-W-UNKNOWN-TOKEN-PATH',
  'ATM-W-UNKNOWN-COLOR',
  'ATM-E-UNKNOWN-TOKEN',
  'TGN-W-UNKNOWN-TOKEN-CATEGORY',
  'TGN-W-UNKNOWN-STRICT-CATEGORY',
]

/** Whether `code` may carry a did-you-mean suggestion: membership in `SUGGESTION_CODES`. */
export function supportsSuggestions(code: string): boolean {
  return SUGGESTION_CODES.includes(code)
}

/**
 * Pick the closest candidate for one diagnostic code, or undefined when the code is not a
 * suggestion code or all candidates are far off. Modules wire their own known sets as
 * `candidates`; the gate decides whether suggesting is legitimate, the distance decides
 * whether any candidate is near enough.
 */
export function suggestForCode(
  code: string,
  unknown: string,
  candidates: string[]
): string | undefined {
  if (!supportsSuggestions(code)) return undefined
  return suggest(unknown, candidates)
}

/**
 * Pick the closest candidate to an unknown name, or undefined when all are far off.
 * Mirrors the Rust helper exactly: within a third of the name, minimum three edits.
 */
export function suggest(unknown: string, candidates: string[]): string | undefined {
  const budget = Math.max(3, Math.floor(unknown.length / 3))
  let best: string | undefined
  let bestDistance = Number.POSITIVE_INFINITY
  for (const candidate of candidates) {
    const distance = editDistance(unknown, candidate)
    if (distance < bestDistance) {
      best = candidate
      bestDistance = distance
    }
  }
  return bestDistance <= budget ? best : undefined
}

function editDistance(first: string, second: string): number {
  const left = [...first]
  const right = [...second]
  let prev = right.map((_, index) => index)
  prev.push(right.length)
  for (let row = 0; row < left.length; row++) {
    const current = new Array<number>(right.length + 1)
    current[0] = row + 1
    for (let col = 0; col < right.length; col++) {
      const deletion = prev[col + 1]! + 1
      const insertion = current[col]! + 1
      const substitution = prev[col]! + (left[row] === right[col] ? 0 : 1)
      current[col + 1] = Math.min(deletion, insertion, substitution)
    }
    prev = current
  }
  return prev[right.length]!
}

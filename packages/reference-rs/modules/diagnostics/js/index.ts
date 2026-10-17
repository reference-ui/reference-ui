/**
 * TypeScript mirror of the reference-rs diagnostics template: one representation, one transport.
 * Takes napi JSON payloads (single diagnostics or batches) and validates the same contract Rust enforces.
 * Emits parsed diagnostics plus one-line rendering and the message-pattern helpers, so both sides of the
 * boundary construct, carry, and display identical values. Codes validate in `parseCode`, never in the type.
 */
import type { Diagnostic as GeneratedDiagnostic } from './generated/Diagnostic.js'
import type { Severity } from './generated/Severity.js'
import type { DiagnosticLocation } from './location.js'
import { parseLocation } from './location.js'
import { DiagnosticParseError, codeSeverityTag, parseCode } from './codes.js'

export type { Severity } from './generated/Severity.js'
export type { ByteSpan } from './generated/ByteSpan.js'
export type { Label } from './generated/Label.js'
export type { Diagnostic as GeneratedDiagnostic } from './generated/Diagnostic.js'
export { createLabel, createSpan, parseLocation } from './location.js'
export type { DiagnosticLocation } from './location.js'
export { MAX_FRAMES, renderBatch, renderFrame } from './render.js'
export {
  DiagnosticParseError,
  REGISTERED_NAMESPACES,
  TEMPLATE_NAMESPACE,
  codeNamespace,
  codeSeverityTag,
  isRegisteredNamespace,
  parseCode,
} from './codes.js'
export type { DiagnosticCode } from './codes.js'
export { warningHintFor } from './hints.js'
export { SUGGESTION_CODES, supportsSuggestions, suggest, suggestForCode } from './suggest.js'

/** Parsed diagnostic: the generated wire shape, guaranteed valid by construction or `parseDiagnostic`. */
export type Diagnostic = GeneratedDiagnostic

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

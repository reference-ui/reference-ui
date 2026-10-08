// Neo diagnostic transport: the pull/push seam across the native cut.
// It takes engine payloads and emits validated typed diagnostics plus the
// lenient legacy carries the compiler channel still needs. Typed values are
// fail-closed (warn/err plus a matching code); info telemetry rides the
// legacy path untouched until the template grows an info level.
import { DiagnosticParseError, codeSeverityTag, parseCode } from '@reference-ui/rust/diagnostics'
import type {
  CompileResultView,
  DiagnosticLabel,
  DiagnosticSpan,
  NeoDiagnostic,
  TastyDiagnosticView,
  TypedDiagnostic,
  TypedSeverity,
} from './types.ts'

/** Parse one typed diagnostic from unknown input (object or JSON string). */
export function parseTypedDiagnostic(input: unknown): TypedDiagnostic {
  const value = typeof input === 'string' ? parseJsonObject(input) : input
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new DiagnosticParseError('diagnostic must be an object')
  }
  const record = value as Record<string, unknown>
  const identity = parseTypedIdentity(record)
  return { ...identity, ...parseTypedLocation(record), ...parseRenderingChannel(record) }
}

function parseTypedIdentity(record: Record<string, unknown>): {
  severity: TypedSeverity
  code: string
  message: string
} {
  const severity = parseTypedSeverity(record.severity)
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
  return { severity, code, message: record.message }
}

/** Parse a typed batch from unknown input (array or JSON string). */
export function parseTypedBatch(input: unknown): TypedDiagnostic[] {
  const value = typeof input === 'string' ? parseJsonArray(input) : input
  if (!Array.isArray(value)) throw new DiagnosticParseError('diagnostic batch must be an array')
  return value.map(parseTypedDiagnostic)
}

/**
 * Canonical wire record: the typed fields in template order (severity, code,
 * message, file, line, column, span, labels, help), unknown keys stripped,
 * absent optionals omitted, and empty label/help lists dropped like Rust.
 * Both js mirrors and the serde struct emit this order, so the same
 * diagnostic encodes to byte-identical JSON on either side of the cut.
 */
export function toCanonicalRecord(diagnostic: TypedDiagnostic): {
  severity: TypedSeverity
  code: string
  message: string
  file?: string
  line?: number
  column?: number
  span?: DiagnosticSpan
  labels?: DiagnosticLabel[]
  help?: string[]
} {
  const record: {
    severity: TypedSeverity
    code: string
    message: string
    file?: string
    line?: number
    column?: number
    span?: DiagnosticSpan
    labels?: DiagnosticLabel[]
    help?: string[]
  } = {
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

/** Encode one typed diagnostic to its canonical wire JSON. */
export function encodeDiagnostic(diagnostic: TypedDiagnostic): string {
  return JSON.stringify(toCanonicalRecord(diagnostic))
}

/** Encode a typed batch for transport; parsing it back round-trips. */
export function encodeBatch(diagnostics: TypedDiagnostic[]): string {
  return JSON.stringify(diagnostics.map(toCanonicalRecord))
}

// Whether the entry already satisfies the typed contract: warn/err severity,
// a well-shaped code whose tag matches, and a non-blank message. Never
// throws — unparseable entries simply read as legacy.
export function isTypedDiagnostic(entry: NeoDiagnostic): entry is TypedDiagnostic {
  if (entry.severity !== 'warning' && entry.severity !== 'error') return false
  if (entry.code === undefined) return false
  try {
    parseCode(entry.code)
  } catch {
    return false
  }
  const expected = entry.severity === 'warning' ? 'W' : 'E'
  if (codeSeverityTag(entry.code) !== expected) return false
  return entry.message.trim().length > 0
}

// Split a channel into typed rows and legacy carries, each in first-seen
// order. Info telemetry, codeless stragglers, and tag mismatches land in
// legacy without blocking the typed rows beside them.
export function partitionTyped(entries: readonly NeoDiagnostic[]): {
  typed: TypedDiagnostic[]
  legacy: NeoDiagnostic[]
} {
  const typed: TypedDiagnostic[] = []
  const legacy: NeoDiagnostic[] = []
  for (const entry of entries) {
    if (isTypedDiagnostic(entry)) typed.push(entry)
    else legacy.push(entry)
  }
  return { typed, legacy }
}

// Pull both sync channels off an engine result: the userspace diagnostics
// plus the opt-in compiler backchannel, each defaulted to its own list so
// reporters never touch the optional field themselves.
export function pullSyncDiagnostics(result: CompileResultView): {
  userspace: NeoDiagnostic[]
  compiler: NeoDiagnostic[]
} {
  return {
    userspace: [...result.diagnostics],
    compiler: [...(result.compilerDiagnostics ?? [])],
  }
}

// Push one tasty engine diagnostic onto the diagnostic shape: severity plus
// the stable `TST-*` code plus the message verbatim, with the source
// location and rendering channel when present. Nothing invented, nothing
// dropped — the ref channel rides the same typed contract as the userspace
// and compiler channels.
export function fromTastyDiagnostic(diagnostic: TastyDiagnosticView): NeoDiagnostic {
  const entry: NeoDiagnostic = {
    severity: diagnostic.level,
    code: diagnostic.code,
    message: diagnostic.message,
  }
  if (diagnostic.file !== undefined) entry.file = diagnostic.file
  if (diagnostic.line !== undefined) entry.line = diagnostic.line
  if (diagnostic.column !== undefined) entry.column = diagnostic.column
  if (diagnostic.span !== undefined) entry.span = diagnostic.span
  if (diagnostic.labels !== undefined) entry.labels = diagnostic.labels
  if (diagnostic.help !== undefined) entry.help = diagnostic.help
  return entry
}

function parseTypedSeverity(input: unknown): TypedSeverity {
  if (input === 'warning' || input === 'error') return input
  throw new DiagnosticParseError('diagnostic severity must be `warning` or `error`')
}

function parseTypedLocation(record: Record<string, unknown>): {
  file?: string
  line?: number
  column?: number
} {
  const location: { file?: string; line?: number; column?: number } = {}
  if (record.file !== undefined) {
    if (typeof record.file !== 'string') {
      throw new DiagnosticParseError('diagnostic file must be a string')
    }
    location.file = record.file
  }
  for (const key of ['line', 'column'] as const) {
    if (record[key] === undefined) continue
    if (typeof record[key] !== 'number' || !Number.isInteger(record[key])) {
      throw new DiagnosticParseError(`diagnostic ${key} must be an integer`)
    }
    location[key] = record[key] as number
  }
  return location
}

// The rendering channel: the byte-offset span plus labeled underlines plus
// help lines. Same fail-closed checks as the native template, so both sides
// of the cut accept and refuse the same bytes.
function parseRenderingChannel(record: Record<string, unknown>): {
  span?: DiagnosticSpan
  labels?: DiagnosticLabel[]
  help?: string[]
} {
  const channel: { span?: DiagnosticSpan; labels?: DiagnosticLabel[]; help?: string[] } = {}
  if (record.span !== undefined) channel.span = parseSpan(record.span)
  // Empty lists normalize to absent, exactly like the Rust deserializer, so
  // both sides of the cut hold the same value for the same bytes.
  if (record.labels !== undefined) {
    const labels = parseLabels(record.labels)
    if (labels.length > 0) channel.labels = labels
  }
  if (record.help !== undefined) {
    const help = parseHelp(record.help)
    if (help.length > 0) channel.help = help
  }
  return channel
}

function parseSpan(input: unknown): DiagnosticSpan {
  if (typeof input !== 'object' || input === null || Array.isArray(input)) {
    throw new DiagnosticParseError('diagnostic span must be an object')
  }
  const record = input as Record<string, unknown>
  const start = parseOffset(record.start, 'start')
  const end = parseOffset(record.end, 'end')
  if (start > end) {
    throw new DiagnosticParseError(`diagnostic span start ${start} is past end ${end}`)
  }
  return { start, end }
}

function parseOffset(input: unknown, key: 'start' | 'end'): number {
  if (typeof input !== 'number' || !Number.isInteger(input)) {
    throw new DiagnosticParseError(`diagnostic span ${key} must be an integer`)
  }
  if (input < 0) {
    throw new DiagnosticParseError(`diagnostic span ${key} must not be negative`)
  }
  return input
}

function parseLabels(input: unknown): DiagnosticLabel[] {
  if (!Array.isArray(input)) {
    throw new DiagnosticParseError('diagnostic labels must be an array')
  }
  return input.map(parseLabel)
}

function parseLabel(input: unknown): DiagnosticLabel {
  if (typeof input !== 'object' || input === null || Array.isArray(input)) {
    throw new DiagnosticParseError('diagnostic label must be an object')
  }
  const record = input as Record<string, unknown>
  const span = parseSpan(record.span)
  if (typeof record.message !== 'string' || record.message.trim().length === 0) {
    throw new DiagnosticParseError('label message must not be blank')
  }
  return { span, message: record.message }
}

function parseHelp(input: unknown): string[] {
  if (!Array.isArray(input)) {
    throw new DiagnosticParseError('diagnostic help must be an array')
  }
  return input.map(line => {
    if (typeof line !== 'string' || line.trim().length === 0) {
      throw new DiagnosticParseError('diagnostic help lines must not be blank')
    }
    return line
  })
}

function parseJsonObject(input: string): unknown {
  try {
    return JSON.parse(input) as unknown
  } catch {
    throw new DiagnosticParseError('diagnostic is not valid JSON')
  }
}

function parseJsonArray(input: string): unknown {
  try {
    return JSON.parse(input) as unknown
  } catch {
    throw new DiagnosticParseError('diagnostic batch is not valid JSON')
  }
}

/**
 * Location parsing for the diagnostics mirror: the file envelope plus the rendering channel.
 * Takes unknown wire payloads or constructor inputs and emits validated locations: file with its
 * resolved line and column, plus the cheap byte-offset span, labeled underlines, and help lines.
 * Every check mirrors the Rust template exactly, so both sides of napi accept and refuse together.
 */
import type { ByteSpan } from './generated/ByteSpan'
import type { Label } from './generated/Label'
import { DiagnosticParseError } from './index'

/** Optional source location accepted by the `create*` constructors. */
export interface DiagnosticLocation {
  file?: string
  line?: number
  column?: number
  span?: ByteSpan
  labels?: Label[]
  help?: string[]
}

interface LocationInput {
  file?: unknown
  line?: unknown
  column?: unknown
  span?: unknown
  labels?: unknown
  help?: unknown
}

/** Parse and validate a location from unknown input, failing closed like Rust. */
export function parseLocation(record: LocationInput): DiagnosticLocation {
  const location: DiagnosticLocation = {}
  parseFileInto(record, location)
  parseLineColumnInto(record, location)
  if (record.span !== undefined) location.span = parseSpanValue(record.span)
  // Empty lists normalize to absent, exactly like the Rust deserializer, so
  // both sides of napi hold the same value for the same bytes.
  if (record.labels !== undefined) {
    const labels = parseLabelsValue(record.labels)
    if (labels.length > 0) location.labels = labels
  }
  if (record.help !== undefined) {
    const help = parseHelpValue(record.help)
    if (help.length > 0) location.help = help
  }
  return location
}

/** Build a byte-offset span; throws on non-integer, negative, or reversed offsets. */
export function createSpan(start: number, end: number): ByteSpan {
  return parseSpanValue({ start, end })
}

/** Build a labeled underline; throws on a bad span or a blank note. */
export function createLabel(span: ByteSpan, message: string): Label {
  return parseLabelValue({ span, message })
}

function parseFileInto(record: LocationInput, location: DiagnosticLocation): void {
  if (record.file === undefined) return
  if (typeof record.file !== 'string') {
    throw new DiagnosticParseError('diagnostic file must be a string')
  }
  location.file = record.file
}

function parseLineColumnInto(record: LocationInput, location: DiagnosticLocation): void {
  for (const key of ['line', 'column'] as const) {
    if (record[key] === undefined) continue
    if (typeof record[key] !== 'number' || !Number.isInteger(record[key])) {
      throw new DiagnosticParseError(`diagnostic ${key} must be an integer`)
    }
    location[key] = record[key] as number
  }
}

function parseLabelsValue(input: unknown): Label[] {
  if (!Array.isArray(input)) {
    throw new DiagnosticParseError('diagnostic labels must be an array')
  }
  return input.map(parseLabelValue)
}

function parseHelpValue(input: unknown): string[] {
  if (!Array.isArray(input)) {
    throw new DiagnosticParseError('diagnostic help must be an array')
  }
  return input.map(parseHelpLine)
}

function parseSpanValue(input: unknown): ByteSpan {
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

function parseLabelValue(input: unknown): Label {
  if (typeof input !== 'object' || input === null || Array.isArray(input)) {
    throw new DiagnosticParseError('diagnostic label must be an object')
  }
  const record = input as Record<string, unknown>
  const span = parseSpanValue(record.span)
  if (typeof record.message !== 'string' || record.message.trim().length === 0) {
    throw new DiagnosticParseError('label message must not be blank')
  }
  return { span, message: record.message }
}

function parseHelpLine(input: unknown): string {
  if (typeof input !== 'string' || input.trim().length === 0) {
    throw new DiagnosticParseError('diagnostic help lines must not be blank')
  }
  return input
}

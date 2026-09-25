/**
 * Deterministic code-frame renderer for human presentation of typed diagnostics.
 * Takes a validated diagnostic plus the source text it was recorded against and emits a rustc-grade
 * frame: a `severity[CODE]: subject` header, a `file:line:col` arrow, guttered source lines with caret
 * underlines, labeled notes, and `= help:` lines. Rendering mirrors the Rust template byte-for-byte —
 * the same diagnostic plus the same source yields the same text on both sides of napi — and anything
 * unresolvable (no file, no spans, dangling offsets) reports undefined so the caller falls back to a
 * one-liner instead of guessing. Columns count UTF-16 code units to match editor carets.
 */
import type { Diagnostic } from './generated/Diagnostic'
import { renderOneLine } from './index'

/**
 * Default cap for `renderBatch`: the first eight diagnostics get full frames while the rest stay
 * one-liners, so a pathological run with thousands of warnings still prints a screenful plus a tight list.
 */
export const MAX_FRAMES = 8

interface Underline {
  start: number
  end: number
  note?: string
}

interface CaretRow {
  line: number
  startCol: number
  width: number
  note?: string
}

/**
 * Render one diagnostic as a full code frame, or undefined when no frame is honest.
 * Needs the file plus at least one span (the primary span or a label), with every offset inside
 * `source` and on a character boundary; anything else falls back to `renderOneLine`.
 */
export function renderFrame(diagnostic: Diagnostic, source: string): string | undefined {
  if (diagnostic.file === undefined) return undefined
  const underlines = collectUnderlines(diagnostic, source)
  if (underlines === undefined) return undefined
  const bytes = Buffer.from(source, 'utf8')
  const starts = lineStarts(bytes)
  const rows: CaretRow[] = []
  for (const underline of underlines) {
    if (!placeRows(underline, bytes, starts, rows)) return undefined
  }
  rows.sort((left, right) => left.line - right.line)
  return emitFrame(diagnostic, diagnostic.file, bytes, starts, rows)
}

/**
 * Render a batch with capped frames: the first `maxFrames` frameable diagnostics get full frames
 * while the rest stay one-liners. Reads each presented file lazily through `sourceFor` and only
 * while frames remain; missing sources and unresolvable spans fall back to one-liners. Blocks join
 * with one newline.
 */
export function renderBatch(
  diagnostics: Diagnostic[],
  sourceFor: (path: string) => string | undefined,
  maxFrames: number = MAX_FRAMES
): string {
  let framed = 0
  const blocks: string[] = []
  for (const diagnostic of diagnostics) {
    const frame = framed < maxFrames ? tryFrame(diagnostic, sourceFor) : undefined
    if (frame !== undefined) {
      framed += 1
      blocks.push(frame)
    } else {
      blocks.push(renderOneLine(diagnostic))
    }
  }
  return blocks.join('\n')
}

function tryFrame(
  diagnostic: Diagnostic,
  sourceFor: (path: string) => string | undefined
): string | undefined {
  if (diagnostic.file === undefined) return undefined
  if (diagnostic.span === undefined && diagnostic.labels === undefined) return undefined
  const source = sourceFor(diagnostic.file)
  if (source === undefined) return undefined
  return renderFrame(diagnostic, source)
}

interface FrameState {
  file: string
  bytes: Buffer
  starts: number[]
  width: number
  pad: string
  lines: string[]
  previous: number | undefined
}

function emitFrame(
  diagnostic: Diagnostic,
  file: string,
  bytes: Buffer,
  starts: number[],
  rows: CaretRow[]
): string | undefined {
  const width = Math.max(...rows.map(row => String(row.line).length))
  const subject = diagnostic.message.split('\n')[0] ?? diagnostic.message
  const state: FrameState = {
    file,
    bytes,
    starts,
    width,
    pad: ' '.repeat(width),
    lines: [`${diagnostic.severity}[${diagnostic.code}]: ${subject}`],
    previous: undefined,
  }
  if (!emitBlocks(state, rows)) return undefined
  for (const line of diagnostic.help ?? []) {
    state.lines.push(`${state.pad} = help: ${line}`)
  }
  return state.lines.join('\n')
}

function emitBlocks(state: FrameState, rows: CaretRow[]): boolean {
  let index = 0
  while (index < rows.length) {
    const line = rows[index]!.line
    let end = index + 1
    while (end < rows.length && rows[end]!.line === line) end += 1
    if (!emitBlock(state, line, rows.slice(index, end))) return false
    state.previous = line
    index = end
  }
  return true
}

function emitBlock(state: FrameState, line: number, group: CaretRow[]): boolean {
  const arrow = arrowFor(line, group, state.previous)
  if (arrow !== undefined) {
    state.lines.push(`  --> ${state.file}:${arrow.line}:${arrow.column}`)
  }
  const text = lineText(state.bytes, state.starts, line)
  if (text === undefined) return false
  state.lines.push(`${String(line).padStart(state.width, ' ')} | ${text}`)
  for (const row of group) {
    state.lines.push(caretRow(state.pad, row))
  }
  return true
}

function caretRow(pad: string, row: CaretRow): string {
  const note = row.note === undefined ? '' : ` ${row.note}`
  return `${pad} | ${' '.repeat(row.startCol - 1)}${'^'.repeat(row.width)}${note}`
}

function arrowFor(
  line: number,
  group: CaretRow[],
  previous: number | undefined
): { line: number; column: number } | undefined {
  if (previous !== undefined && line === previous + 1) return undefined
  const first = group[0]
  if (first === undefined) return undefined
  return { line, column: first.startCol }
}

function collectUnderlines(diagnostic: Diagnostic, source: string): Underline[] | undefined {
  const underlines: Underline[] = []
  if (diagnostic.span !== undefined) {
    underlines.push({ start: diagnostic.span.start, end: diagnostic.span.end })
  }
  for (const label of diagnostic.labels ?? []) {
    underlines.push({ start: label.span.start, end: label.span.end, note: label.message })
  }
  if (underlines.length === 0) return undefined
  const bytes = Buffer.from(source, 'utf8')
  for (const underline of underlines) {
    if (
      !isResolvableOffset(bytes, underline.start) ||
      !isResolvableOffset(bytes, underline.end)
    ) {
      return undefined
    }
  }
  return underlines
}

function placeRows(
  underline: Underline,
  bytes: Buffer,
  starts: number[],
  rows: CaretRow[]
): boolean {
  const first = resolve(bytes, starts, underline.start)
  if (first === undefined) return false
  const lastLine = lastTouchedLine(underline, bytes, starts, first.line)
  if (lastLine === undefined) return false
  for (let line = first.line; line <= lastLine; line++) {
    // Offsets passed `collectUnderlines` validation, so these re-resolutions hold.
    const startCol =
      line === first.line ? resolve(bytes, starts, underline.start)!.column : 1
    const endCol =
      line === lastLine
        ? resolve(bytes, starts, underline.end)!.column
        : contentWidth(bytes, starts, line)! + 1
    rows.push({
      line,
      startCol,
      width: Math.max(endCol - startCol, 1),
      note: line === first.line ? underline.note : undefined,
    })
  }
  return true
}

function lastTouchedLine(
  underline: Underline,
  bytes: Buffer,
  starts: number[],
  firstLine: number
): number | undefined {
  if (underline.end === underline.start) return firstLine
  const end = resolve(bytes, starts, underline.end)
  if (end === undefined) return undefined
  if (underline.end === starts[end.line - 1]) return Math.max(end.line - 1, firstLine)
  return end.line
}

function lineStarts(bytes: Buffer): number[] {
  const starts = [0]
  for (let index = 0; index < bytes.length; index++) {
    if (bytes[index] === 0x0a) starts.push(index + 1)
  }
  return starts
}

function resolve(
  bytes: Buffer,
  starts: number[],
  offset: number
): { line: number; column: number } | undefined {
  if (!isResolvableOffset(bytes, offset)) return undefined
  const line = partitionPoint(starts, offset)
  const tail = bytes.subarray(starts[line - 1]!, offset)
  const column = isAscii(tail) ? tail.length + 1 : tail.toString('utf8').length + 1
  return { line, column }
}

function isResolvableOffset(bytes: Buffer, offset: number): boolean {
  if (!Number.isInteger(offset) || offset < 0 || offset > bytes.length) return false
  if (offset >= bytes.length) return true
  return (bytes[offset]! & 0xc0) !== 0x80
}

function lineText(bytes: Buffer, starts: number[], line: number): string | undefined {
  const start = starts[line - 1]
  if (start === undefined) return undefined
  const next = starts[line]
  const end = next === undefined ? bytes.length : next - 1
  const text = bytes.subarray(start, end).toString('utf8')
  return text.endsWith('\r') ? text.slice(0, -1) : text
}

function contentWidth(bytes: Buffer, starts: number[], line: number): number | undefined {
  const text = lineText(bytes, starts, line)
  return text === undefined ? undefined : text.length
}

function partitionPoint(starts: number[], offset: number): number {
  let low = 0
  let high = starts.length
  while (low < high) {
    const mid = (low + high) >> 1
    if (starts[mid]! <= offset) low = mid + 1
    else high = mid
  }
  return low
}

function isAscii(tail: Buffer): boolean {
  for (let index = 0; index < tail.length; index++) {
    if (tail[index]! >= 0x80) return false
  }
  return true
}

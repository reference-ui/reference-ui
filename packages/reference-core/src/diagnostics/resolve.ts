// Neo span resolution: byte offsets become caret positions above the cut.
// It takes source text plus the cheap spans the compiler recorded and emits
// 1-based line and column pairs matching the native resolver exactly. All
// locating happens here post-compile, lazily, and only for diagnostics
// actually presented — the hot path never reads sources or does line math.
import type { DiagnosticSpan } from './types.ts'

/** 1-based caret position with UTF-16 columns, matching editor carets. */
export interface ResolvedPosition {
  line: number
  column: number
}

/** The structural view resolution reads: file plus span, line and column optional. */
export interface SpanDiagnosticView {
  file?: string
  line?: number
  column?: number
  span?: DiagnosticSpan
}

// Line-start table over UTF-8 bytes: one O(file) build replaces one O(offset)
// scan per lookup. Byte 0x0A is the only line break the native index honors,
// so lone carriage returns stay inside the line exactly as below the cut.
export class ByteLineIndex {
  private readonly bytes: Buffer
  private readonly starts: readonly number[]

  private constructor(bytes: Buffer, starts: readonly number[]) {
    this.bytes = bytes
    this.starts = starts
  }

  /** Record the byte after every newline in a single pass. */
  static forSource(source: string): ByteLineIndex {
    const bytes = Buffer.from(source, 'utf8')
    const starts: number[] = [0]
    for (let index = 0; index < bytes.length; index++) {
      if (bytes[index] === 0x0a) starts.push(index + 1)
    }
    return new ByteLineIndex(bytes, starts)
  }

  /**
   * 1-based line and column for a byte offset, or undefined past the end,
   * off-integer, or mid-character. Columns count UTF-16 code units; ASCII
   * tails skip the decode and read the length straight off the bytes.
   */
  lineCol(offset: number): ResolvedPosition | undefined {
    if (!Number.isInteger(offset) || offset < 0 || offset > this.bytes.length) return undefined
    if (!isCharBoundary(this.bytes, offset)) return undefined
    const line = partitionPoint(this.starts, offset)
    const start = this.starts[line - 1] ?? 0
    const tail = this.bytes.subarray(start, offset)
    if (isAscii(tail)) return { line, column: tail.length + 1 }
    return { line, column: tail.toString('utf8').length + 1 }
  }
}

// The end of the buffer is always a boundary; any other offset must not
// land on a UTF-8 continuation byte (0x80-0xBF), which means mid-character.
function isCharBoundary(bytes: Buffer, offset: number): boolean {
  if (offset >= bytes.length) return true
  return (bytes[offset]! & 0xc0) !== 0x80
}

// True when no byte has the high bit set.
function isAscii(tail: Buffer): boolean {
  for (let index = 0; index < tail.length; index++) {
    if (tail[index]! >= 0x80) return false
  }
  return true
}

// Count of line starts at or before the offset: the 1-based line number.
function partitionPoint(starts: readonly number[], offset: number): number {
  let low = 0
  let high = starts.length
  while (low < high) {
    const mid = (low + high) >> 1
    if (starts[mid]! <= offset) low = mid + 1
    else high = mid
  }
  return low
}

/**
 * One-shot line and column for a byte offset into source text. Prefer an
 * index or the cached resolver when resolving more than one span per file.
 */
export function lineColForOffset(
  source: string,
  offset: number
): ResolvedPosition | undefined {
  return ByteLineIndex.forSource(source).lineCol(offset)
}

/**
 * Cached per-file resolver over a source reader. Reads each file once,
 * resolves only span-carrying diagnostics that lack a line or column, and
 * returns every other diagnostic untouched by reference. Unresolvable spans
 * stay unresolved — no guessed positions, no thrown errors.
 */
export function createSpanResolver(readFile: (path: string) => string | undefined): {
  resolve: <T extends SpanDiagnosticView>(diagnostic: T) => T
} {
  const indexes = new Map<string, ByteLineIndex | undefined>()
  const indexFor = (path: string): ByteLineIndex | undefined => {
    if (!indexes.has(path)) {
      const source = readFile(path)
      indexes.set(path, source === undefined ? undefined : ByteLineIndex.forSource(source))
    }
    return indexes.get(path)
  }
  const resolve = <T extends SpanDiagnosticView>(diagnostic: T): T => {
    if (diagnostic.line !== undefined && diagnostic.column !== undefined) return diagnostic
    if (diagnostic.file === undefined || diagnostic.span === undefined) return diagnostic
    const position = indexFor(diagnostic.file)?.lineCol(diagnostic.span.start)
    if (position === undefined) return diagnostic
    return { ...diagnostic, line: position.line, column: position.column }
  }
  return { resolve }
}

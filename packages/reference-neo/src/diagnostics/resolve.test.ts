// Unit pins for neo-side span resolution.
// They take source texts plus byte offsets and assert 1-based positions
// matching the native resolver offset for offset, including emoji columns,
// past-end and mid-character misses, and the cached resolver's laziness.
import { describe, expect, it } from 'vitest'
import {
  ByteLineIndex,
  createSpanResolver,
  lineColForOffset,
} from './index.ts'

function expectPositions(source: string, cases: Array<[number, [number, number] | undefined]>): void {
  const index = ByteLineIndex.forSource(source)
  for (const [offset, expected] of cases) {
    const position = index.lineCol(offset)
    if (expected === undefined) expect(position, `offset ${offset}`).toBeUndefined()
    else expect(position, `offset ${offset}`).toEqual({ line: expected[0], column: expected[1] })
    expect(lineColForOffset(source, offset), `one-shot ${offset}`).toEqual(position ?? undefined)
  }
}

describe('ByteLineIndex', () => {
  it('counts lines and columns from one', () => {
    expectPositions('ab\ncd', [
      [0, [1, 1]],
      [3, [2, 1]],
      [4, [2, 2]],
    ])
  })

  it('counts columns in UTF-16 units like editor carets', () => {
    expectPositions('a😀b', [
      [0, [1, 1]],
      [1, [1, 2]],
      [5, [1, 4]],
      [6, [1, 5]],
    ])
  })

  it('rejects offsets past the end and mid-character', () => {
    expectPositions('ab', [
      [2, [1, 3]],
      [3, undefined],
      [-1, undefined],
      [1.5, undefined],
    ])
    expectPositions('a😀b', [
      [2, undefined],
      [3, undefined],
      [4, undefined],
    ])
  })

  it('matches the native edge shapes', () => {
    expectPositions('', [
      [0, [1, 1]],
      [1, undefined],
    ])
    expectPositions('\n', [
      [0, [1, 1]],
      [1, [2, 1]],
      [2, undefined],
    ])
    expectPositions('trailing\n', [
      [8, [1, 9]],
      [9, [2, 1]],
    ])
    expectPositions('a\r\nb\r\n', [
      [0, [1, 1]],
      [3, [2, 1]],
    ])
    expectPositions('line one\nline two is longer\nx', [
      [0, [1, 1]],
      [9, [2, 1]],
      [27, [2, 19]],
      [28, [3, 1]],
    ])
  })

  it('matches a naive decoder on generated text offset for offset', () => {
    const alphabet = ['a', 'bb', '\n', '😀', '\r\n', 'z', '\n\n', 'é']
    let seed = 0x12345678
    let text = ''
    for (let round = 0; round < 400; round++) {
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0
      text += alphabet[(seed >>> 8) % alphabet.length]
    }
    const bytes = Buffer.from(text, 'utf8')
    const index = ByteLineIndex.forSource(text)
    for (let offset = 0; offset <= bytes.length + 1; offset++) {
      expect(index.lineCol(offset), `offset ${offset}`).toEqual(naiveLineCol(text, offset))
    }
  })
})

// Independent oracle: no line table, no binary search, no continuation-byte
// test. A fatal decoder rejects mid-character cuts the way the native
// byte-slice lookup does, and string length counts UTF-16 units.
const fatalDecoder = new TextDecoder('utf-8', { fatal: true })

function naiveLineCol(
  source: string,
  offset: number
): { line: number; column: number } | undefined {
  const bytes = Buffer.from(source, 'utf8')
  if (!Number.isInteger(offset) || offset < 0 || offset > bytes.length) return undefined
  let prefix: string
  try {
    prefix = fatalDecoder.decode(bytes.subarray(0, offset))
  } catch {
    return undefined
  }
  const lines = prefix.split('\n')
  const tail = lines[lines.length - 1] ?? ''
  return { line: lines.length, column: tail.length + 1 }
}

describe('createSpanResolver', () => {
  const files: Record<string, string> = { 'src/a.ts': 'ab\ncd\nef' }

  it('resolves span-only diagnostics and leaves the rest by reference', () => {
    let reads = 0
    const { resolve } = createSpanResolver(path => {
      reads += 1
      return files[path]
    })
    const located = { file: 'src/a.ts', line: 1, column: 1, span: { start: 4, end: 5 } }
    expect(resolve(located)).toBe(located)
    const unspanned = { file: 'src/a.ts', message: 'm' }
    expect(resolve(unspanned)).toBe(unspanned)
    const resolved = resolve({ file: 'src/a.ts', span: { start: 4, end: 5 } })
    expect(resolved).toEqual({ file: 'src/a.ts', span: { start: 4, end: 5 }, line: 2, column: 2 })
    const again = resolve({ file: 'src/a.ts', span: { start: 0, end: 1 } })
    expect(again).toMatchObject({ line: 1, column: 1 })
    expect(reads).toBe(1)
  })

  it('stays honest when the source or offset is unusable', () => {
    const { resolve } = createSpanResolver(path => files[path])
    const missing = { file: 'src/gone.ts', span: { start: 0, end: 1 } }
    expect(resolve(missing)).toBe(missing)
    const pastEnd = { file: 'src/a.ts', span: { start: 99, end: 100 } }
    expect(resolve(pastEnd)).toBe(pastEnd)
  })
})

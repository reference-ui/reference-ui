// Fail-loud splitter for the stream goldens: it takes one whole-string sheet and emits its per-layer SystemStreams
// entry, throwing on any chunk it does not recognize. The corpus literals stay the single source of truth, so the
// goldens derive their entries instead of hand-copying them.

import type { SystemStreams } from './types.ts'

const BLOCK_OPEN = /^@layer ([A-Za-z-]+) \{\n/
const PREAMBLE_LINE = /^@layer [^;{]+;\n/

const CHUNK_FIELDS = {
  reset: 'reset',
  global: 'global',
  recipes: 'recipes',
  utilities: 'utilities',
} as const

type TokensField = 'tokens' | 'tokensPortable'

interface SplitOptions {
  tokensField?: TokensField
  wrapped: boolean
  pkg?: string
}

function unwrapEntry(name: string, css: string): string {
  const open = css.indexOf('\n')
  const close = css.lastIndexOf('}\n')
  if (open === -1 || close === -1 || close <= open) {
    throw new Error(`splitEntry(${name}): expected a package-wrapped sheet`)
  }
  return css.slice(open + 1, close)
}

function topLevelStarts(inner: string): number[] {
  const starts: number[] = []
  let depth = 0
  for (let i = 0; i < inner.length; i += 1) {
    const ch = inner[i]
    if (ch === '{') depth += 1
    else if (ch === '}') depth -= 1
    else if (depth === 0 && inner.startsWith('@layer', i) && (i === 0 || inner[i - 1] === '\n')) {
      starts.push(i)
    }
  }
  return starts
}

function splitTopLevel(inner: string): string[] {
  const starts = topLevelStarts(inner)
  return starts.map((start, index) => inner.slice(start, starts[index + 1] ?? inner.length))
}

function assignChunk(name: string, entry: SystemStreams, chunk: string, field: TokensField): void {
  if (PREAMBLE_LINE.test(chunk)) {
    entry.preamble = chunk
    return
  }
  const kind = BLOCK_OPEN.exec(chunk)?.[1]
  if (kind === undefined) {
    throw new Error(`splitEntry(${name}): unrecognized chunk ${JSON.stringify(chunk.slice(0, 40))}`)
  }
  if (kind === 'tokens') {
    entry[field] = chunk
    return
  }
  const target = (CHUNK_FIELDS as Record<string, 'reset' | 'global' | 'recipes' | 'utilities'>)[kind]
  if (target === undefined) {
    throw new Error(`splitEntry(${name}): unknown layer kind ${JSON.stringify(kind)}`)
  }
  entry[target] = chunk
}

/** Split one whole-string sheet into its per-layer entry; unknown chunks throw. */
export function splitEntry(name: string, css: string, options: SplitOptions): SystemStreams {
  const { root, rest } = splitLeadingRoot(css)
  const inner = options.wrapped ? unwrapEntry(name, rest) : rest
  const entry: SystemStreams = { name, preamble: '' }
  if (root !== undefined) entry.root = root
  const field = options.tokensField ?? 'tokensPortable'
  for (const chunk of splitTopLevel(inner)) assignChunk(name, entry, chunk, field)
  if (options.pkg !== undefined) entry.package = options.pkg
  return entry
}

/** Peel the engine's leading `@layer root` chunk (outside the wrap, when present). */
function splitLeadingRoot(css: string): { root?: string; rest: string } {
  if (!css.startsWith('@layer root {')) return { rest: css }
  const end = findChunkEnd(css)
  if (end === -1) throw new Error('splitEntry: unterminated leading @layer root chunk')
  return { root: css.slice(0, end), rest: css.slice(end) }
}

/** Offset just past a leading block's depth-zero close (newline included); -1 when open. */
function findChunkEnd(css: string): number {
  let depth = 0
  for (let i = 0; i < css.length; i += 1) {
    if (css[i] === '{') depth += 1
    else if (css[i] === '}') {
      depth -= 1
      if (depth === 0) return i + (css[i + 1] === '\n' ? 2 : 1)
    }
  }
  return -1
}

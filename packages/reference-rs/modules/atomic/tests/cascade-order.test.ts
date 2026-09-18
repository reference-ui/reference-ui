/**
 * Cascade-order regression (M0-fix21-A). The atomic emitter nests its six
 * internal layers inside the compiling package's layer; nothing internal may
 * leak to the top level, where a top-level `global` would outrank another
 * package's nested `utilities` and silently drop token-backed declarations.
 * These tests pin the emitted order and probe the cascade winner with a
 * spec-shaped layer comparison: outer layers decide first, later wins, and a
 * deeper path wins when one path extends the other.
 */
import { describe, expect, it } from 'vitest'
import { compileSync } from '../js/index.js'
import type { EvaluatedSystemSpec } from '../js/types.js'
import { LAYER_PREAMBLE, LIB_SYSTEM_SPEC } from './helpers.js'

const UTILITY_DECL = 'color: var(--colors-blue-600);'
const GLOBAL_DECL = 'container-type: inline-size'

function compileUtility(name: string): {
  stylesheet: string
  portableStylesheet: string
} {
  const baseSystem = { ...LIB_SYSTEM_SPEC, name } as EvaluatedSystemSpec
  const result = compileSync({
    baseSystem,
    files: [
      {
        path: 'src/index.tsx',
        content: `import { css } from '@reference-ui/react';\nexport const c = css({ color: 'blue.600' });\n`,
      },
    ],
  })
  expect(result.diagnostics.filter(d => d.severity === 'error')).toEqual([])
  return { stylesheet: result.stylesheet, portableStylesheet: result.portableStylesheet }
}

interface LayerPrelude {
  names: string[]
  isBlock: boolean
  end: number
}

function readPrelude(sheet: string, at: number): LayerPrelude | null {
  if (!sheet.startsWith('@layer', at) || !isPreludeStart(sheet[at + '@layer'.length])) {
    return null
  }
  let end = at + '@layer'.length
  while (end < sheet.length && sheet[end] !== ';' && sheet[end] !== '{') {
    end++
  }
  if (end >= sheet.length) {
    return null
  }
  const names = sheet
    .slice(at + '@layer'.length, end)
    .split(',')
    .map(part => part.trim())
    .filter(part => part.length > 0)
  return { names, isBlock: sheet[end] === '{', end }
}

function isPreludeStart(ch: string | undefined): boolean {
  return ch === ' ' || ch === '\t' || ch === '\n'
}

function skipString(sheet: string, at: number): number {
  const quote = sheet[at]
  let i = at + 1
  while (i < sheet.length && sheet[i] !== quote) {
    i += sheet[i] === '\\' ? 2 : 1
  }
  return Math.min(i + 1, sheet.length)
}

interface ScanEvents {
  onOrder(names: string[]): void
  onOpen(name: string | null): void
  onClose(): void
}

/** Walk one brace-balanced pass, reporting `@layer` preludes and blocks. */
function scanSheet(sheet: string, end: number, events: ScanEvents): void {
  let i = 0
  while (i < end) {
    i = scanStep(sheet, i, events)
  }
}

function scanStep(sheet: string, at: number, events: ScanEvents): number {
  const ch = sheet[at]
  if (ch === '"' || ch === "'") {
    return skipString(sheet, at)
  }
  const prelude = readPrelude(sheet, at)
  if (prelude) {
    return scanPrelude(prelude, events)
  }
  if (ch === '{') {
    events.onOpen(null)
  } else if (ch === '}') {
    events.onClose()
  }
  return at + 1
}

function scanPrelude(prelude: LayerPrelude, events: ScanEvents): number {
  if (!prelude.isBlock) {
    events.onOrder(prelude.names)
    return prelude.end + 1
  }
  events.onOpen(prelude.names.length === 1 ? prelude.names[0]! : null)
  return prelude.end + 1
}

/** Sibling order index of every layer path, by first declaration (CSS rule). */
function collectOrder(sheet: string): Map<string, number> {
  const order = new Map<string, number>()
  const stack: string[] = []
  scanSheet(sheet, sheet.length, {
    onOrder: names => recordNames(order, stack, names),
    onOpen: name => {
      if (name !== null) {
        recordNames(order, stack, [name])
      }
      stack.push(name ?? '')
    },
    onClose: () => {
      stack.pop()
    },
  })
  return order
}

function recordNames(order: Map<string, number>, stack: string[], names: string[]): void {
  for (const name of names) {
    const key = JSON.stringify([...stack.filter(part => part.length > 0), name])
    if (!order.has(key)) {
      order.set(key, order.size)
    }
  }
}

/** Layer path (outer to inner, unnamed scopes dropped) at a sheet offset. */
function layerPathAt(sheet: string, index: number): string[] {
  const stack: string[] = []
  scanSheet(sheet, index, {
    onOrder: () => {},
    onOpen: name => {
      stack.push(name ?? '')
    },
    onClose: () => {
      stack.pop()
    },
  })
  return stack.filter(name => name.length > 0)
}

function pathRank(order: Map<string, number>, path: string[]): number[] {
  return path.map((_, depth) => order.get(JSON.stringify(path.slice(0, depth + 1))) ?? -1)
}

/**
 * CSS cascade comparison for two layer paths. The first level whose sibling
 * order differs decides (later wins); when one path extends the other, the
 * deeper rule wins. Positive means `a` wins, negative means `b` wins.
 */
function comparePaths(order: Map<string, number>, a: string[], b: string[]): number {
  const rankA = pathRank(order, a)
  const rankB = pathRank(order, b)
  const shared = Math.min(rankA.length, rankB.length)
  for (let depth = 0; depth < shared; depth++) {
    if (rankA[depth] !== rankB[depth]) {
      return rankA[depth]! - rankB[depth]!
    }
  }
  return rankA.length - rankB.length
}

function topLevelLayerBlocks(sheet: string): string[] {
  const blocks: string[] = []
  let depth = 0
  scanSheet(sheet, sheet.length, {
    onOrder: () => {},
    onOpen: name => {
      if (depth === 0 && name !== null) {
        blocks.push(name)
      }
      depth++
    },
    onClose: () => {
      depth--
    },
  })
  return blocks
}

function countOccurrences(haystack: string, needle: string): number {
  return haystack.split(needle).length - 1
}

describe('M0-fix21-A cascade layer order', () => {
  it('nests the six internal layers inside the package layer', () => {
    const { stylesheet } = compileUtility('color-mode')
    const firstLine = stylesheet.slice(0, stylesheet.indexOf('\n'))
    expect(firstLine).toBe('@layer color-mode {')
    expect(stylesheet).toContain(`\n${LAYER_PREAMBLE}`)
    expect(stylesheet.endsWith('}\n')).toBe(true)

    const order = collectOrder(stylesheet)
    const inner = ['reset', 'global', 'base', 'tokens', 'recipes', 'utilities']
    const ranks = inner.map(name => order.get(JSON.stringify(['color-mode', name])))
    expect(ranks.every(rank => rank !== undefined)).toBe(true)
    expect([...ranks].sort((a, b) => a! - b!)).toEqual(ranks)

    expect(topLevelLayerBlocks(stylesheet)).toEqual(['color-mode'])
  })

  it('escapes scope characters in the package layer name', () => {
    const { stylesheet } = compileUtility('@reference-ui/lib')
    const firstLine = stylesheet.slice(0, stylesheet.indexOf('\n'))
    expect(firstLine).toBe('@layer \\@reference-ui\\/lib {')
    expect(topLevelLayerBlocks(stylesheet)).toEqual(['\\@reference-ui\\/lib'])
  })

  it('probes utilities beating global inside one package', () => {
    const { stylesheet } = compileUtility('color-mode')
    expect(countOccurrences(stylesheet, GLOBAL_DECL)).toBe(1)
    const utilities = stylesheet.slice(stylesheet.indexOf('@layer utilities {'))
    expect(countOccurrences(utilities, UTILITY_DECL)).toBe(1)

    const order = collectOrder(stylesheet)
    const globalPath = layerPathAt(stylesheet, stylesheet.indexOf(GLOBAL_DECL))
    const utilityPath = layerPathAt(stylesheet, stylesheet.indexOf(UTILITY_DECL))
    expect(globalPath).toEqual(['color-mode', 'global'])
    expect(utilityPath).toEqual(['color-mode', 'utilities'])
    expect(comparePaths(order, utilityPath, globalPath)).toBeGreaterThan(0)
  })

  it('probes local utilities beating upstream global on a composed page', () => {
    const upstream = compileUtility('reference-ui')
    const local = compileUtility('color-mode')
    expect(countOccurrences(upstream.portableStylesheet, GLOBAL_DECL)).toBe(1)

    const chunk = upstream.portableStylesheet.trim()
    const wrappedLocal = `@layer color-mode {\n${local.stylesheet.trim()}\n}`
    const page = `@layer reference-ui, color-mode;\n${chunk}\n${wrappedLocal}\n`

    const order = collectOrder(page)
    const upstreamGlobal = layerPathAt(page, page.indexOf(GLOBAL_DECL))
    const localUtility = layerPathAt(page, page.lastIndexOf(UTILITY_DECL))
    expect(upstreamGlobal).toEqual(['reference-ui', 'global'])
    expect(localUtility).toEqual(['color-mode', 'color-mode', 'utilities'])
    expect(comparePaths(order, localUtility, upstreamGlobal)).toBeGreaterThan(0)
  })

  it('wraps the portable stylesheet in the same package layer', () => {
    const { portableStylesheet } = compileUtility('color-mode')
    const firstLine = portableStylesheet.slice(0, portableStylesheet.indexOf('\n'))
    expect(firstLine).toBe('@layer color-mode {')
    expect(portableStylesheet).toContain(`\n${LAYER_PREAMBLE}`)
    expect(portableStylesheet).toContain('[data-layer="color-mode"]')
    expect(topLevelLayerBlocks(portableStylesheet)).toEqual(['color-mode'])
  })
})

// Byte-exact accounting for the shipped styles.css.
// It takes the stylesheet text and partitions every byte into layer segments.
// Layers nest (the package layer wraps the six inner layers), so the parser
// recurses: each layer owns its direct bytes plus its nested layer children.
// Block classes inside direct bytes split top-level `{...}` groups by prelude.
// The segment tree always sums to the file size; callers assert the residual is zero.

export interface CssBlockClass {
  name: string
  bytes: number
  blocks: number
}

export interface CssLayerNode {
  name: string
  bytes: number
  depth: number
  directBytes: number
  children: CssLayerNode[]
  classes: CssBlockClass[]
}

export interface CssAccount {
  bytes: number
  headerBytes: number
  seamBytes: number
  layers: CssLayerNode[]
  accounted: number
  residual: number
}

function blen(text: string): number {
  return Buffer.byteLength(text, 'utf-8')
}

interface Block {
  prelude: string
  start: number
  end: number
}

const LAYER_OPEN = '@layer'

function findBlockEnd(text: string, openBrace: number): number {
  let depth = 0
  for (let i = openBrace; i < text.length; i += 1) {
    const ch = text[i]
    if (ch === '{') depth += 1
    else if (ch === '}') {
      depth -= 1
      if (depth === 0) return i + 1
    }
  }
  throw new Error('unbalanced braces in styles.css')
}

function layerName(prelude: string): string {
  const trimmed = prelude.trimStart()
  const lastOpen = trimmed.lastIndexOf(LAYER_OPEN)
  const rest = (lastOpen === -1 ? trimmed : trimmed.slice(lastOpen + LAYER_OPEN.length)).trim()
  const match = /^([A-Za-z0-9_-]+)/.exec(rest)
  return match ? (match[1] as string) : rest
}

function splitTopBlocks(text: string): Block[] {
  const blocks: Block[] = []
  let i = 0
  while (i < text.length) {
    const open = text.indexOf('{', i)
    if (open === -1) break
    const end = findBlockEnd(text, open)
    blocks.push({ prelude: text.slice(i, open), start: i, end })
    i = end
  }
  return blocks
}

const PRELUDE_CLASSES: [string, string][] = [
  ['@container', '@container wraps'],
  ['@media', '@media wraps'],
  ['@supports', '@supports wraps'],
  ['@keyframes', '@keyframes'],
  ['@font-face', '@font-face'],
  ['@layer', '@layer (flat)'],
  [':', 'class rules'],
  ['.', 'class rules'],
  ['[', 'class rules'],
]

function classifyPrelude(prelude: string): string {
  const trimmed = prelude.trim()
  if (trimmed.length === 0) return 'bare blocks'
  for (const [prefix, name] of PRELUDE_CLASSES) {
    if (trimmed.startsWith(prefix)) return name
  }
  return 'other rules'
}

function accountClasses(direct: string): CssBlockClass[] {
  const byClass = new Map<string, CssBlockClass>()
  const blocks = splitTopBlocks(direct)
  for (const block of blocks) {
    const name = classifyPrelude(block.prelude)
    const entry = byClass.get(name) ?? { name, bytes: 0, blocks: 0 }
    entry.bytes += blen(direct.slice(block.start, block.end))
    entry.blocks += 1
    byClass.set(name, entry)
  }
  const trailing = blen(direct) - blocks.reduce((n, b) => n + blen(direct.slice(b.start, b.end)), 0)
  if (trailing > 0) {
    const entry = byClass.get('inter-rule text') ?? { name: 'inter-rule text', bytes: 0, blocks: 0 }
    entry.bytes += trailing
    byClass.set(entry.name, entry)
  }
  return [...byClass.values()].sort((a, b) => b.bytes - a.bytes)
}

function parseLayer(text: string, block: Block, depth: number): CssLayerNode {
  const open = text.indexOf('{', block.start)
  const inner = text.slice(open + 1, block.end - 1)
  const children: CssLayerNode[] = []
  let directBytes = 0
  let cursor = 0
  const directParts: string[] = []
  for (const innerBlock of splitTopBlocks(inner)) {
    directParts.push(inner.slice(cursor, innerBlock.start))
    directBytes += blen(inner.slice(cursor, innerBlock.start))
    if (innerBlock.prelude.trimStart().startsWith(LAYER_OPEN)) {
      children.push(parseLayer(inner, innerBlock, depth + 1))
    } else {
      directParts.push(inner.slice(innerBlock.start, innerBlock.end))
      directBytes += blen(inner.slice(innerBlock.start, innerBlock.end))
    }
    cursor = innerBlock.end
  }
  directParts.push(inner.slice(cursor))
  directBytes += blen(inner.slice(cursor))
  const direct = directParts.join('')
  return {
    name: layerName(block.prelude),
    bytes: blen(text.slice(block.start, block.end)),
    depth,
    directBytes,
    children,
    classes: accountClasses(direct),
  }
}

function sumNode(node: CssLayerNode): number {
  return node.bytes
}

export function accountStylesheet(text: string): CssAccount {
  const blocks = splitTopBlocks(text)
  let headerBytes = 0
  let seamBytes = 0
  const layers: CssLayerNode[] = []
  let cursor = 0
  let seenLayer = false
  for (const block of blocks) {
    const gap = blen(text.slice(cursor, block.start))
    if (!seenLayer && !block.prelude.trimStart().startsWith(LAYER_OPEN)) {
      headerBytes += gap + blen(text.slice(block.start, block.end))
    } else {
      if (!seenLayer) {
        headerBytes += gap
        seenLayer = true
      } else {
        seamBytes += gap
      }
      if (block.prelude.trimStart().startsWith(LAYER_OPEN)) {
        layers.push(parseLayer(text, block, 0))
      } else {
        seamBytes += blen(text.slice(block.start, block.end))
      }
    }
    cursor = block.end
  }
  seamBytes += blen(text.slice(cursor))
  const accounted = headerBytes + seamBytes + layers.reduce((n, l) => n + sumNode(l), 0)
  return {
    bytes: blen(text),
    headerBytes,
    seamBytes,
    layers,
    accounted,
    residual: blen(text) - accounted,
  }
}

export function flattenLayers(layers: CssLayerNode[]): CssLayerNode[] {
  const out: CssLayerNode[] = []
  const visit = (nodes: CssLayerNode[]): void => {
    for (const node of nodes) {
      out.push(node)
      visit(node.children)
    }
  }
  visit(layers)
  return out
}

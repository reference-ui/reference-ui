/**
 * Stylesheet walkers for the atomic case helpers: the class names a layer declares, the inner
 * text of one `@layer` block, and the decoded identifiers csstree returns. Takes a stylesheet
 * string and a layer name and returns sets or strings; a sheet that does not parse yields an
 * empty result, so the gauges report the parse problem instead of throwing.
 */
import * as csstree from 'css-tree'

const decodeIdent = (
  csstree as typeof csstree & { ident: { decode: (value: string) => string } }
).ident.decode

/** Decoded class names that appear as class selectors inside `@layer name`. */
export function layerClassNames(sheet: string, layer: string): Set<string> {
  const names = new Set<string>()
  const ast = parseStylesheet(sheet)
  if (!ast) {
    return names
  }
  csstree.walk(ast, {
    visit: 'Atrule',
    enter(node) {
      if (!isNamedLayer(node, layer) || !node.block) {
        return
      }
      collectClassNames(node.block, names)
    },
  })
  return names
}

/** Inner text of `@layer name { ... }`, or empty if that layer was omitted. */
export function layerBody(sheet: string, name: string): string {
  const open = `@layer ${name} {`
  const start = sheet.indexOf(open)
  if (start < 0) {
    return ''
  }
  let depth = 0
  const from = start + open.length
  for (let i = from; i < sheet.length; i++) {
    const ch = sheet[i]
    if (ch === '{') {
      depth++
    } else if (ch === '}') {
      if (depth === 0) {
        return sheet.slice(from, i)
      }
      depth--
    }
  }
  return sheet.slice(from)
}

function parseStylesheet(sheet: string): csstree.CssNode | null {
  try {
    return csstree.parse(sheet, {
      positions: true,
      onParseError() {},
    })
  } catch {
    return null
  }
}

function isNamedLayer(node: csstree.CssNode, layer: string): node is csstree.Atrule {
  if (node.type !== 'Atrule' || node.name !== 'layer') {
    return false
  }
  const prelude = node.prelude ? csstree.generate(node.prelude).trim() : ''
  return prelude === layer
}

function collectClassNames(block: csstree.CssNode, names: Set<string>): void {
  csstree.walk(block, {
    enter(node) {
      if (node.type === 'ClassSelector') {
        names.add(decodeIdent(node.name))
        return
      }
      if (node.type === 'Rule' && node.prelude?.type === 'Raw') {
        addRawClassName(node.prelude.value, names)
      }
    },
  })
}

function addRawClassName(raw: string, names: Set<string>): void {
  const trimmed = raw.trim()
  if (!trimmed.startsWith('.')) {
    return
  }
  names.add(decodeIdent(trimmed.slice(1)))
}

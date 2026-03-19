import postcss, { type AtRule, type ChildNode, type Container, type Rule } from 'postcss'
import selectorParser from 'postcss-selector-parser'
import { renderPortableStylesheet, type LayerTokenBlock } from '../render/stylesheet'

/**
 * Transform Panda-emitted CSS into the portable stylesheet shape we store on
 * `baseSystem.css`. Preserves Panda's internal layer declarations, wraps
 * content in `@layer <name>`, and re-scopes token declarations to
 * `[data-layer="<name>"]`.
 */

interface ParsedTokensLayer {
  rootTokenDeclarations: string
  themeTokenBlocks: LayerTokenBlock[]
  preservedContent: string
}

function isTokensLayerRule(node: ChildNode | undefined): node is AtRule {
  return Boolean(
    node &&
    node.type === 'atrule' &&
    node.name === 'layer' &&
    node.params.trim() === 'tokens' &&
    node.nodes
  )
}

function findTokensLayer(container: Container): AtRule | undefined {
  return container.nodes?.find(isTokensLayerRule)
}

function isRootTokenRule(node: Rule): boolean {
  return node.selector.trim().startsWith(':where(:root')
}

function stringifyCssNode(node: ChildNode): string {
  const text = node.toString()
  if (node.type === 'decl' || (node.type === 'atrule' && !node.nodes)) {
    return text.endsWith(';') ? text : `${text};`
  }
  return text
}

function stringifyNodes(nodes: ChildNode[] | undefined): string {
  if (!nodes?.length) return ''
  return normalizeBlockContent(nodes.map(stringifyCssNode).join('\n'))
}

function normalizeBlockContent(content: string): string {
  const trimmed = content.trim()
  if (!trimmed) return ''

  const lines = trimmed.split('\n')
  const nonEmptyLines = lines.filter(line => line.trim())
  const minIndent = Math.min(
    ...nonEmptyLines.map(line => line.match(/^(\s*)/)?.[1].length ?? 0)
  )

  return lines
    .map(line => {
      if (!line.trim()) return ''
      return `  ${line.slice(minIndent).trimEnd()}`
    })
    .join('\n')
    .trim()
}

function splitSelectorList(selector: string): string[] {
  const ast = selectorParser().astSync(selector)
  return ast.nodes.map(entry => entry.toString().trim()).filter(Boolean)
}

function rewriteTokenSelector(selector: string, layerName: string): string {
  const layerSelector = `[data-layer="${layerName}"]`
  return splitSelectorList(selector)
    .flatMap(part => [`${layerSelector}${part}`, `${part} ${layerSelector}`])
    .join(', ')
}

function parseTokensLayer(
  tokensLayer: AtRule | undefined,
  layerName: string
): ParsedTokensLayer {
  if (!tokensLayer?.nodes?.length) {
    return {
      rootTokenDeclarations: '',
      themeTokenBlocks: [],
      preservedContent: '',
    }
  }

  let rootTokenDeclarations = ''
  const themeTokenBlocks: LayerTokenBlock[] = []
  const preservedBlocks: string[] = []

  for (const node of tokensLayer.nodes) {
    if (node.type === 'rule') {
      if (isRootTokenRule(node)) {
        rootTokenDeclarations = stringifyNodes(node.nodes)
        continue
      }

      const declarations = stringifyNodes(node.nodes)
      if (!declarations) continue
      themeTokenBlocks.push({
        selector: rewriteTokenSelector(node.selector, layerName),
        declarations,
      })
      continue
    }

    if (node.type === 'atrule') {
      preservedBlocks.push(node.toString().trim())
    }
  }

  return {
    rootTokenDeclarations,
    themeTokenBlocks,
    preservedContent: preservedBlocks.join('\n\n'),
  }
}

function removeOriginalTokensLayer(root: postcss.Root): string {
  const strippedRoot = root.clone()
  const tokensLayer = findTokensLayer(strippedRoot)
  tokensLayer?.remove()
  return strippedRoot.nodes.map(stringifyCssNode).join('\n').trim()
}

function kebabToCamelCase(value: string): string {
  return value.replace(/-([a-z0-9])/g, (_, char: string) => char.toUpperCase())
}

function extractPublicColorTokenUtilities(
  rootTokenDeclarations: string,
  content: string
): string {
  const colorTokens = new Map<string, string>()
  const matches = rootTokenDeclarations.matchAll(/--colors-([a-z0-9-]+)\s*:/gi)
  for (const match of matches) {
    const cssVarSuffix = match[1]
    const tokenName = kebabToCamelCase(cssVarSuffix)
    if (!/^[A-Za-z][A-Za-z0-9]*$/.test(tokenName)) continue
    colorTokens.set(tokenName, cssVarSuffix)
  }

  const utilityRules: string[] = []
  for (const [tokenName, cssVarSuffix] of colorTokens) {
    if (!content.includes(`.bg_${tokenName}`)) {
      utilityRules.push(`  .bg_${tokenName} {`)
      utilityRules.push(`    background: var(--colors-${cssVarSuffix});`)
      utilityRules.push('}')
      utilityRules.push('')
    }

    if (!content.includes(`.bg-c_${tokenName}`)) {
      utilityRules.push(`  .bg-c_${tokenName} {`)
      utilityRules.push(`    background-color: var(--colors-${cssVarSuffix});`)
      utilityRules.push('}')
      utilityRules.push('')
    }

    if (!content.includes(`.c_${tokenName}`)) {
      utilityRules.push(`  .c_${tokenName} {`)
      utilityRules.push(`    color: var(--colors-${cssVarSuffix});`)
      utilityRules.push('}')
      utilityRules.push('')
    }
  }

  while (utilityRules.at(-1) === '') utilityRules.pop()
  return utilityRules.join('\n')
}

/**
 * Transform raw Panda CSS into the portable stylesheet shape.
 * 1. Preserve Panda's internal @layer order declaration
 * 2. Wrap the stylesheet in `@layer <layerName> { ... }`
 * 3. Extract token declarations and append `[data-layer="<layerName>"] { ... }`
 */
export function createPortableStylesheetFromContent(
  css: string,
  layerName: string
): string {
  const root = postcss.parse(css)
  const tokensLayer = findTokensLayer(root)
  const { rootTokenDeclarations, themeTokenBlocks, preservedContent } = parseTokensLayer(
    tokensLayer,
    layerName
  )
  const strippedContent = removeOriginalTokensLayer(root)
  const baseContent = preservedContent
    ? `${strippedContent}\n\n@layer tokens {\n${preservedContent}\n}`
    : strippedContent
  const generatedColorUtilities = extractPublicColorTokenUtilities(
    rootTokenDeclarations,
    baseContent
  )
  const content = generatedColorUtilities
    ? `${baseContent}\n\n@layer utilities {\n${generatedColorUtilities}\n}`
    : baseContent

  return renderPortableStylesheet({
    layerName,
    content,
    rootTokenDeclarations,
    themeTokenBlocks,
  })
}

import { renderPortableStylesheet, type LayerTokenBlock } from '../render/stylesheet'

/**
 * Transform Panda-emitted CSS into the portable stylesheet shape we store on
 * `baseSystem.css`. Preserves Panda's internal layer declarations, wraps
 * content in `@layer <name>`, and re-scopes token declarations to
 * `[data-layer="<name>"]`.
 */

function findMatchingBrace(text: string, startIndex: number): number {
  let depth = 1
  for (let i = startIndex + 1; i < text.length; i++) {
    const c = text[i]
    if (c === '{') depth++
    else if (c === '}') depth--
    if (depth === 0) return i
  }
  return text.length
}

interface ParsedTokensLayer {
  rootTokenDeclarations: string
  themeTokenBlocks: LayerTokenBlock[]
  preservedContent: string
}

function extractTokensLayerContent(css: string): string {
  const tokensMatch = css.match(/@layer\s+tokens\s*\{/)
  if (!tokensMatch) return ''

  const afterTokensOpen = tokensMatch.index! + tokensMatch[0].length
  const tokensEnd = findMatchingBrace(css, afterTokensOpen - 1)
  return css.slice(afterTokensOpen, tokensEnd)
}

function rewriteTokenSelector(selector: string, layerName: string): string {
  const layerSelector = `[data-layer="${layerName}"]`
  return selector
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean)
    .flatMap((part) => [`${layerSelector}${part}`, `${layerSelector} ${part}`])
    .join(', ')
}

function parseTokensLayer(css: string, layerName: string): ParsedTokensLayer {
  const layerContent = extractTokensLayerContent(css)
  if (!layerContent) {
    return {
      rootTokenDeclarations: '',
      themeTokenBlocks: [],
      preservedContent: '',
    }
  }

  let rootTokenDeclarations = ''
  const themeTokenBlocks: LayerTokenBlock[] = []
  const preservedBlocks: string[] = []
  let index = 0

  while (index < layerContent.length) {
    const openIndex = layerContent.indexOf('{', index)
    if (openIndex === -1) break

    const blockStart = index
    const selector = layerContent.slice(index, openIndex).trim()
    const closeIndex = findMatchingBrace(layerContent, openIndex)
    const body = layerContent.slice(openIndex + 1, closeIndex).trim()
    index = closeIndex + 1

    if (!selector || !body) {
      continue
    }

    if (selector.startsWith(':where(:root')) {
      rootTokenDeclarations = body
      continue
    }

    if (selector.startsWith('@')) {
      preservedBlocks.push(layerContent.slice(blockStart, closeIndex + 1).trim())
      continue
    }

    themeTokenBlocks.push({
      selector: rewriteTokenSelector(selector, layerName),
      declarations: dedentDeclarations(body),
    })
  }

  return {
    rootTokenDeclarations,
    themeTokenBlocks,
    preservedContent: preservedBlocks.join('\n\n'),
  }
}

function stripTokensLayer(css: string): string {
  const tokensMatch = css.match(/@layer\s+tokens\s*\{/)
  if (!tokensMatch) return css

  const start = tokensMatch.index ?? 0
  const end = findMatchingBrace(css, start + tokensMatch[0].length - 1) + 1
  return (css.slice(0, start) + css.slice(end)).trim()
}

function dedentDeclarations(declarations: string): string {
  if (!declarations.trim()) return ''
  const lines = declarations.split('\n').filter((l) => l.trim())
  const minIndent = Math.min(
    ...lines.map((l) => l.match(/^(\s*)/)?.[1].length ?? 0),
  )
  return lines.map((l) => `  ${l.slice(minIndent).trim()}`).join('\n')
}

/**
 * Transform raw Panda CSS into the portable stylesheet shape.
 * 1. Preserve Panda's internal @layer order declaration
 * 2. Wrap the stylesheet in `@layer <layerName> { ... }`
 * 3. Extract token declarations and append `[data-layer="<layerName>"] { ... }`
 */
export function createPortableStylesheetFromContent(css: string, layerName: string): string {
  const parsedTokensLayer = parseTokensLayer(css, layerName)
  const rootTokenDeclarations = dedentDeclarations(parsedTokensLayer.rootTokenDeclarations)
  const { themeTokenBlocks, preservedContent } = parsedTokensLayer
  const strippedContent = stripTokensLayer(css)
  const content = preservedContent
    ? `${strippedContent}\n\n@layer tokens {\n${preservedContent}\n}`
    : strippedContent

  return renderPortableStylesheet({
    layerName,
    content,
    rootTokenDeclarations,
    themeTokenBlocks,
  })
}

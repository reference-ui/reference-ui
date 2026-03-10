/**
 * Transform Panda-emitted CSS into layer-ready CSS for layers mode.
 * Strips the top-level @layer order declaration, wraps content in @layer <name>,
 * and re-scopes token declarations to [data-layer="<name>"].
 */

/** Find the index of the closing '}' that matches the '{' at startIndex (exclusive end). */
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

/**
 * Extract token declarations from Panda's @layer tokens { :where(:root, :host) { ... } } block.
 * Returns the inner declarations (custom properties) for re-scoping to [data-layer].
 */
function extractTokenDeclarations(css: string): string {
  const tokensMatch = css.match(/@layer\s+tokens\s*\{/)
  if (!tokensMatch) return ''

  const afterTokensOpen = tokensMatch.index! + tokensMatch[0].length
  const tokensEnd = findMatchingBrace(css, afterTokensOpen - 1)
  const layerContent = css.slice(afterTokensOpen, tokensEnd)
  const whereMatch = layerContent.match(/:where\(:root,\s*:host\)\s*\{/)
  if (!whereMatch) return ''

  const afterWhereOpen = whereMatch.index! + whereMatch[0].length
  const whereEnd = findMatchingBrace(layerContent, afterWhereOpen - 1)
  return layerContent.slice(afterWhereOpen, whereEnd).trim()
}

/**
 * Remove Panda's root token layer so layers mode does not leak tokens globally.
 */
function stripTokensLayer(css: string): string {
  const tokensMatch = css.match(/@layer\s+tokens\s*\{/)
  if (!tokensMatch) return css

  const start = tokensMatch.index ?? 0
  const end = findMatchingBrace(css, start + tokensMatch[0].length - 1) + 1
  return (css.slice(0, start) + css.slice(end)).trim()
}

/**
 * Normalise indentation of extracted declarations so [data-layer] block is consistent.
 */
function dedentDeclarations(declarations: string): string {
  if (!declarations.trim()) return ''
  const lines = declarations.split('\n').filter((l) => l.trim())
  const minIndent = Math.min(
    ...lines.map((l) => l.match(/^(\s*)/)?.[1].length ?? 0)
  )
  return lines.map((l) => '  ' + l.slice(minIndent).trim()).join('\n')
}

/**
 * Strip the top-level @layer a, b, c; order declaration from Panda output.
 * Must appear at stylesheet root; we rely on source order instead.
 * Uses bounded [^;\n]{0,200} to avoid sonarjs/slow-regex (Panda order lists are short).
 */
function stripOrderDeclaration(css: string): string {
  const orderRegex = /^@layer\s+[^;\n]{0,200};\s*\n?/
  return css.replace(orderRegex, '').trimStart()
}

/**
 * Transform raw Panda CSS into layer-ready CSS.
 * 1. Strips the @layer order declaration
 * 2. Wraps remaining content in @layer <layerName> { ... }
 * 3. Extracts token declarations and appends [data-layer="<layerName>"] { ... } with normalised indentation
 */
export function createLayerCssFromContent(css: string, layerName: string): string {
  const tokenDeclarations = dedentDeclarations(extractTokenDeclarations(css))
  const withoutOrder = stripOrderDeclaration(stripTokensLayer(css))
  const dataLayerBlock =
    tokenDeclarations.length > 0
      ? `\n\n[data-layer="${layerName}"] {\n${tokenDeclarations}\n}\n`
      : ''
  return `@layer ${layerName} {\n${withoutOrder}\n}${dataLayerBlock}`
}

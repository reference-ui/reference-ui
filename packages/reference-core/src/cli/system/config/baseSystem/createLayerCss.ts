import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { log } from '../../../lib/log'

/**
 * Extract token declarations from Panda's @layer tokens { :where(:root, :host) { ... } } block.
 * Returns the inner declarations (custom properties) for re-scoping to [data-layer].
 */
function extractTokenDeclarations(css: string): string {
  const tokensMatch = css.match(/@layer\s+tokens\s*\{/)
  if (!tokensMatch) return ''

  const afterTokensOpen = tokensMatch.index! + tokensMatch[0].length
  let depth = 1
  let i = afterTokensOpen
  while (i < css.length && depth > 0) {
    const c = css[i]
    if (c === '{') depth++
    else if (c === '}') depth--
    i++
  }
  const layerContent = css.slice(afterTokensOpen, i - 1)
  const whereMatch = layerContent.match(/:where\(:root,\s*:host\)\s*\{/)
  if (!whereMatch) return ''

  const afterWhereOpen = whereMatch.index! + whereMatch[0].length
  depth = 1
  i = afterWhereOpen
  while (i < layerContent.length && depth > 0) {
    const c = layerContent[i]
    if (c === '{') depth++
    else if (c === '}') depth--
    i++
  }
  return layerContent.slice(afterWhereOpen, i - 1).trim()
}

/**
 * Strip the top-level @layer a, b, c; order declaration from Panda output.
 * Must appear at stylesheet root; we rely on source order instead.
 */
function stripOrderDeclaration(css: string): string {
  const orderRegex = /^@layer\s+[^;]+;\s*\n?/
  return css.replace(orderRegex, '').trimStart()
}

/**
 * Create layer-ready CSS from Panda's styles.css.
 *
 * 1. Reads Panda-emitted styles.css
 * 2. Strips the @layer order declaration (first line)
 * 3. Wraps remaining @layer blocks in @layer <name> { ... }
 * 4. Extracts token declarations and appends [data-layer="<name>"] { ... }
 *
 * The result is embedded as baseSystem.css for layers consumers.
 */
export function createLayerCss(
  stylesPath: string,
  layerName: string
): string | undefined {
  const absPath = resolve(stylesPath)
  if (!existsSync(absPath)) {
    log.debug('createLayerCss', `styles.css not found at ${absPath}, skipping`)
    return undefined
  }

  const raw = readFileSync(absPath, 'utf-8')
  const tokenDeclarations = extractTokenDeclarations(raw)
  const withoutOrder = stripOrderDeclaration(raw)

  const wrapped = `@layer ${layerName} {\n${withoutOrder}\n}\n\n[data-layer="${layerName}"] {\n${tokenDeclarations}\n}\n`

  return wrapped
}

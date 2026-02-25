import { dirname } from 'node:path'

const CORE_PACKAGE = '@reference-ui/react'
const CSS_BINDING = 'css'

/**
 * Compute relative path from a file in virtual to the styled-system css entry.
 * Assumes .virtual/<relativePath> → outdir: src/system/css
 */
function getStyledSystemCssRelativePath(relativePath: string): string {
  const dir = dirname(relativePath)
  const segments = dir.split(/[/\\]/).filter(Boolean)
  const ups = segments.length + 1 // +1 for .virtual/
  return '../'.repeat(ups) + 'src/system/css'
}

/**
 * Rewrite imports only via string replacement so we never re-print the rest of the file.
 * When we see `css` imported from @reference-ui/core, replace that import
 * with: (1) import { css } from '<styled-system/css>', (2) optional second line with
 * the rest from @reference-ui/core.
 * The rest of the source is left byte-for-byte unchanged.
 */
export async function rewriteCssImports(
  sourceCode: string,
  relativePath: string
): Promise<string> {
  const ts = await import('typescript')
  const isTsx = /\.(tsx|jsx)$/.test(relativePath)
  const sourceFile = ts.createSourceFile(
    'temp-file',
    sourceCode,
    ts.ScriptTarget.Latest,
    true,
    isTsx ? ts.ScriptKind.TSX : ts.ScriptKind.TS
  )

  const styledSystemPath = getStyledSystemCssRelativePath(relativePath)
  let replacement: { start: number; end: number; text: string } | null = null

  function visit(node: ts.Node) {
    if (!ts.isImportDeclaration(node)) {
      ts.forEachChild(node, visit)
      return
    }
    const specifier = node.moduleSpecifier
    if (!ts.isStringLiteral(specifier) || specifier.text !== CORE_PACKAGE) {
      ts.forEachChild(node, visit)
      return
    }
    const clause = node.importClause
    if (
      !clause ||
      clause.isTypeOnly ||
      !clause.namedBindings ||
      !ts.isNamedImports(clause.namedBindings)
    ) {
      ts.forEachChild(node, visit)
      return
    }
    const elements = clause.namedBindings.elements
    const restNames: string[] = []
    let hasCss = false
    for (const el of elements) {
      const importedName = (el.propertyName ?? el.name).getText(sourceFile)
      if (importedName === CSS_BINDING) {
        hasCss = true
        // Note: We don't track local name since css doesn't get renamed
      } else {
        const part = el.propertyName
          ? `${el.propertyName.getText(sourceFile)} as ${el.name.getText(sourceFile)}`
          : el.name.getText(sourceFile)
        restNames.push(part)
      }
    }
    if (!hasCss) {
      ts.forEachChild(node, visit)
      return
    }
    const start = node.getStart(sourceFile)
    const end = node.getEnd()
    const defaultName = clause.name ? clause.name.getText(sourceFile) : null
    const cssLine = `import { css } from '${styledSystemPath}';\n`
    let coreLine = ''
    if (restNames.length > 0 || defaultName) {
      if (restNames.length === 0) {
        coreLine = `import ${defaultName} from '${CORE_PACKAGE}';\n`
      } else if (defaultName) {
        coreLine = `import ${defaultName}, { ${restNames.join(', ')} } from '${CORE_PACKAGE}';\n`
      } else {
        coreLine = `import { ${restNames.join(', ')} } from '${CORE_PACKAGE}';\n`
      }
    }
    replacement = { start, end, text: cssLine + coreLine }
    ts.forEachChild(node, visit)
  }

  visit(sourceFile)
  if (!replacement) return sourceCode

  // Replace the import (no function name replacement needed for css)
  const { start, end, text } = replacement
  const result = sourceCode.slice(0, start) + text + sourceCode.slice(end)

  return result
}

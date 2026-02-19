import * as ts from 'typescript'
import { dirname } from 'node:path'

const CORE_PACKAGE = '@reference-ui/core'
const CVA_BINDING = 'cva'

/**
 * Compute relative path from a file in codegen to the styled-system css entry.
 * Assumes codegen/<relativePath> → outdir: src/system/css
 */
function getStyledSystemCssRelativePath(relativePath: string): string {
  const dir = dirname(relativePath)
  const segments = dir.split(/[/\\]/).filter(Boolean)
  const ups = segments.length + 1 // +1 for codegen/
  return '../'.repeat(ups) + 'src/system/css'
}

/**
 * Rewrite imports only via string replacement so we never re-print the rest of the file.
 * When we see `cva` (or alias) imported from @reference-ui/core, replace that import
 * with: (1) import { cva } from '<styled-system/css>', (2) optional second line with
 * the rest from @reference-ui/core. The rest of the source is left byte-for-byte unchanged.
 */
export function rewriteCvaImports(sourceCode: string, relativePath: string): string {
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
    let hasCva = false
    for (const el of elements) {
      const importedName = (el.propertyName ?? el.name).getText(sourceFile)
      if (importedName === CVA_BINDING) {
        hasCva = true
      } else {
        const part = el.propertyName
          ? `${el.propertyName.getText(sourceFile)} as ${el.name.getText(sourceFile)}`
          : el.name.getText(sourceFile)
        restNames.push(part)
      }
    }
    if (!hasCva) {
      ts.forEachChild(node, visit)
      return
    }
    const start = node.getStart(sourceFile)
    const end = node.getEnd()
    const defaultName = clause.name ? clause.name.getText(sourceFile) : null
    const cvaLine = `import { cva } from '${styledSystemPath}';\n`
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
    replacement = { start, end, text: cvaLine + coreLine }
    ts.forEachChild(node, visit)
  }

  visit(sourceFile)
  if (!replacement) return sourceCode
  const { start, end, text } = replacement
  return sourceCode.slice(0, start) + text + sourceCode.slice(end)
}

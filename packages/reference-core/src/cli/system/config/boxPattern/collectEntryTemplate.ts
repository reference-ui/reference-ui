import { toRelativeImport } from '../../../lib/path'

export interface BuildCollectEntryOptions {
  refDir: string
  outputPath: string
  initCollectorPath: string
  extendBoxPatternPath: string
  extensionFilePaths: string[]
}

/**
 * Build entry that imports extensions, collects them, extracts transform sources,
 * and writes to JSON for generateBoxPattern to read.
 */
export function buildCollectEntryContent(
  options: BuildCollectEntryOptions
): string {
  const {
    refDir,
    outputPath,
    initCollectorPath,
    extendBoxPatternPath,
    extensionFilePaths,
  } = options

  const initRel = toRelativeImport(refDir, initCollectorPath)
  const extendRel = toRelativeImport(refDir, extendBoxPatternPath)

  const extensionImports = extensionFilePaths.map(
    path => `import '${toRelativeImport(refDir, path)}'`
  )

  const lines = [
    `import '${initRel}'`,
    ...extensionImports,
    ``,
    `import { writeFileSync } from 'node:fs'`,
    `import { getBoxPatternExtensions } from '${extendRel}'`,
    ``,
    `function extractTransformBody(fnSource) {`,
    `  const s = fnSource.trim()`,
    `  const i = s.indexOf('{')`,
    `  const j = s.lastIndexOf('}')`,
    `  return i >= 0 && j > i ? s.slice(i + 1, j).trim() : s`,
    `}`,
    ``,
    `const extensions = getBoxPatternExtensions()`,
    `const data = extensions.map(ext => ({`,
    `  properties: ext.properties,`,
    `  transformSource: extractTransformBody(ext.transform.toString())`,
    `}))`,
    ``,
    `writeFileSync(${JSON.stringify(outputPath)}, JSON.stringify(data, null, 2))`,
    ``,
  ]

  return lines.join('\n')
}

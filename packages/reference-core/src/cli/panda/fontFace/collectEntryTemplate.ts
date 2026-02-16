import { relative } from 'node:path'

export interface BuildFontCollectEntryOptions {
  refDir: string
  outputPath: string
  initFontCollectorPath: string
  extendFontFacePath: string
  fontsFilePath: string
}

function toRelativeImport(refDir: string, absolutePath: string): string {
  const rel = relative(refDir, absolutePath)
    .replace(/\.tsx?$/, '')
    .replace(/\\/g, '/')
  return rel.startsWith('.') ? rel : `./${rel}`
}

/**
 * Build entry that imports fonts.ts, runs font() calls, and writes
 * collected definitions to JSON for generateFontSystem to read.
 * Mirrors boxPattern/collectEntryTemplate.ts structure.
 */
export function buildFontCollectEntryContent(options: BuildFontCollectEntryOptions): string {
  const { refDir, outputPath, initFontCollectorPath, extendFontFacePath, fontsFilePath } = options

  const initRel = toRelativeImport(refDir, initFontCollectorPath)
  const fontsRel = toRelativeImport(refDir, fontsFilePath)
  const extendRel = toRelativeImport(refDir, extendFontFacePath)

  const lines = [
    `import '${initRel}'`,
    `import '${fontsRel}'`,
    ``,
    `import { writeFileSync } from 'node:fs'`,
    `import { getFontDefinitions } from '${extendRel}'`,
    ``,
    `const definitions = getFontDefinitions()`,
    `writeFileSync(${JSON.stringify(outputPath)}, JSON.stringify(definitions, null, 2))`,
    ``,
  ]

  return lines.join('\n')
}

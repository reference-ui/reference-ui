import { toRelativeImport } from '../../../lib/path'

export interface BuildBaseSystemCollectEntryOptions {
  refDir: string
  jsonOutputPath: string
  initCollectorPath: string
  extendPandaConfigPath: string
  deepMergePath: string
  configFilePaths: string[]
}

/**
 * Build entry that imports all config fragments (same as panda entry), merges them,
 * extracts public API (tokens, font, keyframes, globalCss), and writes to JSON.
 * Uses runCollectScript + microBundle — same pipeline as createFontSystem, createBoxPattern.
 */
export function buildBaseSystemCollectEntryContent(
  options: BuildBaseSystemCollectEntryOptions
): string {
  const {
    refDir,
    jsonOutputPath,
    initCollectorPath,
    extendPandaConfigPath,
    deepMergePath,
    configFilePaths,
  } = options

  const initCollectorRel = toRelativeImport(refDir, initCollectorPath)
  const extendPandaRel = toRelativeImport(refDir, extendPandaConfigPath)
  const deepMergeRel = toRelativeImport(refDir, deepMergePath)

  const configImports = configFilePaths.map(
    (path, idx) => `import * as cfg${idx} from '${toRelativeImport(refDir, path)}'`
  )

  const defaultFragmentsList = configFilePaths.map((_, idx) => `cfg${idx}`)

  const lines = [
    `// Generated - collect baseSystem from config fragments (same bundle as panda entry)`,
    ``,
    `import '${initCollectorRel}'`,
    `import { COLLECTOR_KEY } from '${extendPandaRel}'`,
    `import { deepMerge } from '${deepMergeRel}'`,
    `import { writeFileSync } from 'node:fs'`,
    ...configImports,
    ``,
    `const defaultFragments = [${defaultFragmentsList.join(', ')}]`,
    `  .map((m) => (m?.default !== undefined ? m.default : null))`,
    `  .filter(Boolean)`,
    ``,
    `const collected = (globalThis[COLLECTOR_KEY] || [])`,
    `const fragments = [...defaultFragments, ...collected]`,
    `const merged = fragments.reduce((acc, frag) => deepMerge(acc, frag), {})`,
    ``,
    `// Extract public API only: tokens, font, keyframes, globalCss`,
    `const theme = merged.theme ?? {}`,
    `const themeExtend = theme.extend ?? {}`,
    `const tokens = deepMerge({}, theme.tokens ?? {}, themeExtend.tokens ?? {})`,
    `const keyframes = deepMerge({}, theme.keyframes ?? {}, themeExtend.keyframes ?? {})`,
    `const font = tokens.fonts ?? {}`,
    `const globalCss = merged.globalCss ?? {}`,
    ``,
    `const extracted = { tokens, font, keyframes, globalCss }`,
    `writeFileSync(${JSON.stringify(jsonOutputPath)}, JSON.stringify(extracted))`,
    ``,
  ]

  return lines.join('\n')
}

import { relative } from 'node:path'

export interface BuildPandaEntryOptions {
  refDir: string
  initCollectorPath: string
  extendPandaConfigPath: string
  deepMergePath: string
  configFilePaths: string[]
}

function toRelativeImport(refDir: string, absolutePath: string): string {
  const rel = relative(refDir, absolutePath)
    .replace(/\.tsx?$/, '')
    .replace(/\\/g, '/')
  return rel.startsWith('.') ? rel : `./${rel}`
}

/**
 * Builds the entry file content that imports all config fragments and merges them
 * into a single Panda config export.
 */
export function buildPandaEntryContent(options: BuildPandaEntryOptions): string {
  const { refDir, initCollectorPath, extendPandaConfigPath, deepMergePath, configFilePaths } = options

  const initCollectorRel = toRelativeImport(refDir, initCollectorPath)
  const extendPandaRel = toRelativeImport(refDir, extendPandaConfigPath)
  const deepMergeRel = toRelativeImport(refDir, deepMergePath)

  const configImports = configFilePaths.map(
    (path, idx) => `import * as cfg${idx} from '${toRelativeImport(refDir, path)}'`
  )

  const defaultFragmentsList = configFilePaths.map((_, idx) => `cfg${idx}`)

  const lines = [
    `// Generated entry - imports and merges all config fragments`,
    ``,
    `import '${initCollectorRel}'`,
    `import { defineConfig } from '@pandacss/dev'`,
    `import { COLLECTOR_KEY } from '${extendPandaRel}'`,
    `import { deepMerge } from '${deepMergeRel}'`,
    ...configImports,
    ``,
    `const defaultFragments = [${defaultFragmentsList.join(', ')}]`,
    `  .map((m) => (m?.default !== undefined ? m.default : null))`,
    `  .filter(Boolean)`,
    ``,
    `const collected = (globalThis[COLLECTOR_KEY] || [])`,
    `const fragments = [...defaultFragments, ...collected]`,
    `const config = fragments.reduce((acc, frag) => deepMerge(acc, frag), {})`,
    ``,
    `export default defineConfig(config)`,
    ``,
  ]

  return lines.join('\n')
}

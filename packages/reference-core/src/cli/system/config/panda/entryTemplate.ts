import type { BaseSystem } from '@reference-ui/cli/config'
import { toRelativeImport } from '../../../lib/path'

export interface BuildPandaEntryOptions {
  refDir: string
  initCollectorPath: string
  extendPandaConfigPath: string
  deepMergePath: string
  configFilePaths: string[]
  /** Upstream baseSystems from ui.config.extends — merged into theme so Panda generates var() refs */
  extends?: BaseSystem[]
}

/**
 * Builds the entry file content that imports all config fragments and merges them
 * into a single Panda config export.
 */
export function buildPandaEntryContent(options: BuildPandaEntryOptions): string {
  const {
    refDir,
    initCollectorPath,
    extendPandaConfigPath,
    deepMergePath,
    configFilePaths,
    extends: upstream = [],
  } = options

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
    `let config = fragments.reduce((acc, frag) => deepMerge(acc, frag), {})`,
    ``,
    `// Merge extends[] baseSystem tokens into theme so Panda generates utilities with proper var() refs`,
    `const upstream = ${JSON.stringify(upstream)}`,
    `if (upstream?.length) {`,
    `  config.theme = config.theme || {}`,
    `  config.theme.tokens = config.theme.tokens || {}`,
    `  for (const sys of upstream) {`,
    `    if (sys?.tokens) config.theme.tokens = deepMerge(config.theme.tokens, sys.tokens)`,
    `  }`,
    `}`,
    ``,
    `export default defineConfig(config)`,
    ``,
  ]

  return lines.join('\n')
}

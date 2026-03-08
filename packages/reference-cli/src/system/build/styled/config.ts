import { bundleCollectorRuntime, scanForFragments } from '../../../lib/fragments'
import { createPandaConfig } from '../../panda/config/create'
import {
  resolveInternalPatternFiles,
  writePandaExtensionsBundle,
} from '../../panda/config/extensions/api/bundle'
import { createKeyframesCollector } from '../../api/keyframes'
import { createTokensCollector } from '../../api/tokens'
import { createFontCollector } from '../../api/font'
import { createGlobalCssCollector } from '../../api/globalCss'
import { createBoxPatternCollector } from '../../api/patterns'

const styledBaseConfig = {
  preflight: false,
  outdir: '.',
  include: ['./src/**/*.{ts,tsx}'],
  exclude: ['**/*.d.ts'],
}

export async function getFragmentFiles(cliRoot: string): Promise<string[]> {
  console.log('[build:styled] Scanning for system fragments...')
  const files = scanForFragments({
    include: ['src/**/*.{ts,tsx}'],
    importFrom: ['@reference-ui/system', '@reference-ui/cli/config'],
    exclude: [
      '**/node_modules/**',
      '**/*.d.ts',
      '**/dist/**',
      '**/.reference-ui/**',
      '**/*.test.ts',
      '**/*.test.tsx',
      '**/*.spec.ts',
      '**/*.spec.tsx',
      '**/build/**',
      '**/system/styled/**',
      '**/scripts/**',
    ],
    cwd: cliRoot,
  })
  console.log(`[build:styled] Found ${files.length} fragment files`)
  return files
}

export interface GenerateStyledConfigOptions {
  cliRoot: string
  styledDir: string
  pandaConfigPath: string
  systemEntry: string
  fragmentFiles: string[]
}

export async function generateStyledConfig(options: GenerateStyledConfigOptions): Promise<void> {
  console.log('[build:styled] Generating panda.config.ts...')
  const { cliRoot, styledDir, pandaConfigPath, systemEntry, fragmentFiles } = options

  const configFragmentFiles = fragmentFiles.filter(
    (file) =>
      !file.includes('/build/') &&
      !file.includes('/system/styled/') &&
      !file.includes('/scripts/')
  )
  const internalPatternFiles = resolveInternalPatternFiles(cliRoot)

  const collectorBundle = await bundleCollectorRuntime({
    files: [...configFragmentFiles, ...internalPatternFiles],
    collectors: [
      createTokensCollector(),
      createKeyframesCollector(),
      createFontCollector(),
      createGlobalCssCollector(),
      createBoxPatternCollector(),
    ],
    alias: {
      '@reference-ui/system': systemEntry,
      '@reference-ui/cli/config': systemEntry,
    },
  })

  await writePandaExtensionsBundle(cliRoot, styledDir)

  await createPandaConfig({
    outputPath: pandaConfigPath,
    collectorBundle,
    baseConfig: styledBaseConfig,
    extensionsImportPath: './extensions/index.mjs',
  })

  console.log('[build:styled] Config generated at:', pandaConfigPath)
}

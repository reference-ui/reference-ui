#!/usr/bin/env node
/**
 * Build script for generating the internal styled package.
 *
 * 1. Scans for token fragment files
 * 2. Generates panda.config.ts (collector + injected bundles via createPandaConfig)
 * 3. Runs Panda to output styled package to ./src/system/styled/
 */

import { resolve, join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { mkdirSync, writeFileSync } from 'node:fs'
import type { FragmentCollector } from '../lib/fragments'
import { scanForFragments } from '../lib/fragments'
import { createPandaConfig } from '../system/panda/config/createPandaConfig'
import { createTokensCollector } from '../system/api/tokens'
import { generate as pandaGenerate } from '@pandacss/node'

const __filename = fileURLToPath(import.meta.url)
const CLI_ROOT = resolve(dirname(__filename), '../..')
const STYLED_DIR = join(CLI_ROOT, 'src/system/styled')
const PANDA_CONFIG_PATH = join(STYLED_DIR, 'panda.config.ts')
const systemEntry = join(CLI_ROOT, 'src/entry/system.ts')

async function getFragmentFiles(): Promise<string[]> {
  console.log('[build:styled] Scanning for token fragments...')
  const files = scanForFragments({
    include: ['src/**/*.{ts,tsx}'],
    functionNames: ['tokens'],
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
    cwd: CLI_ROOT,
  })
  console.log(`[build:styled] Found ${files.length} fragment files`)
  return files
}

async function generateStyleConfig(fragmentFiles: string[]): Promise<void> {
  console.log('[build:styled] Generating panda.config.ts...')

  const styledBaseConfig = {
    preflight: false,
    outdir: '.',
    include: ['./src/**/*.{ts,tsx}'],
    exclude: ['**/*.d.ts'],
  }

  const configFragmentFiles = fragmentFiles.filter(
    (f) =>
      !f.includes('/build/') &&
      !f.includes('/system/styled/') &&
      !f.includes('/scripts/')
  )

  await createPandaConfig({
    outputPath: PANDA_CONFIG_PATH,
    fragmentFiles: configFragmentFiles,
    collector: createTokensCollector() as FragmentCollector,
    baseConfig: styledBaseConfig,
    fragmentBundleAlias: {
      '@reference-ui/system': systemEntry,
      '@reference-ui/cli/config': systemEntry,
    },
  })

  console.log('[build:styled] Config generated at:', PANDA_CONFIG_PATH)
}

async function runPandaCodegen(): Promise<void> {
  console.log('[build:styled] Running Panda codegen...')
  await pandaGenerate({ cwd: STYLED_DIR }, PANDA_CONFIG_PATH)
  console.log('[build:styled] Panda codegen complete')
}

async function buildStyledPackage(): Promise<void> {
  try {
    console.log('[build:styled] Starting styled package build...\n')
    mkdirSync(STYLED_DIR, { recursive: true })

    const fragmentFiles = await getFragmentFiles()
    await generateStyleConfig(fragmentFiles)
    await runPandaCodegen()

    const metadataPath = join(STYLED_DIR, 'metadata.json')
    writeFileSync(
      metadataPath,
      JSON.stringify(
        { fragmentsCollected: fragmentFiles.length, outputPath: STYLED_DIR, generatedAt: new Date().toISOString() },
        null,
        2
      ),
      'utf-8'
    )

    console.log('\n[build:styled] ✓ Styled package built successfully!')
    console.log(`[build:styled] Output: ${STYLED_DIR}`)
    process.exit(0)
  } catch (error) {
    console.error('\n[build:styled] ✗ Build failed:', error)
    process.exit(1)
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  await buildStyledPackage()
}

export { buildStyledPackage }

#!/usr/bin/env node
/**
 * Build script for generating the internal styled package.
 *
 * This script:
 * 1. Collects token fragments from the codebase
 * 2. Generates panda.config.ts using collected tokens
 * 3. Runs Panda to output styled package to ./src/system/styled/
 * 4. Creates metadata for ref sync injection
 */

import { resolve, join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { mkdirSync, writeFileSync, readFileSync, existsSync } from 'node:fs'
import type { FragmentCollector } from '../lib/fragments'
import { collectFragments, scanForFragments, bundleFragments } from '../lib/fragments'
import { createPandaConfig } from '../system/config/createPandaConfig'
import { createPandaConfigCollector } from '../system/api/extendPandaConfig'
import { generate as pandaGenerate } from '@pandacss/node'

const __filename = fileURLToPath(import.meta.url)
const CLI_ROOT = resolve(dirname(__filename), '../..')
const STYLED_DIR = join(CLI_ROOT, 'src/system/styled')
const pandaCollector = createPandaConfigCollector()
const PANDA_CONFIG_PATH = join(STYLED_DIR, 'panda.config.ts')
const INTERNAL_FRAGMENTS_PATH = join(CLI_ROOT, 'src/system/styled/internal-fragments.mjs')

interface StylePackageMetadata {
  fragmentsCollected: number
  outputPath: string
  generatedAt: string
}

async function collectTokenFragments(): Promise<{
  fragmentFiles: string[]
  collectedTokens: unknown[]
}> {
  console.log('[build:styled] Scanning for token fragments...')

  const fragmentFiles = scanForFragments({
    include: ['src/**/*.{ts,tsx}'],
    functionNames: ['tokens', 'extendPandaConfig'],
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

  console.log(`[build:styled] Found ${fragmentFiles.length} fragment files`)

  if (fragmentFiles.length === 0) {
    console.log('[build:styled] No token fragments found, using defaults')
    return { fragmentFiles: [], collectedTokens: [] }
  }

  const tempDir = join(STYLED_DIR, '.tmp')

  const result = await collectFragments({
    files: fragmentFiles,
    collector: pandaCollector as FragmentCollector<unknown, unknown>,
    tempDir,
  })

  console.log('[build:styled] Collected tokens:', result.length)

  return { fragmentFiles, collectedTokens: result }
}

async function generateStyleConfig(fragmentFiles: string[]): Promise<void> {
  console.log('[build:styled] Generating panda.config.ts...')

  // Full override — do NOT use baseConfig (that's for userspace ref sync).
  // We run from STYLED_DIR, so outdir '.' → src/system/styled
  const styledBaseConfig = {
    preflight: false,
    outdir: '.',
    include: ['./src/**/*.{ts,tsx}'],
    exclude: ['**/*.d.ts'],
  }

  const configFragmentFiles = fragmentFiles.filter(
    f =>
      !f.includes('/build/') &&
      !f.includes('/system/styled/') &&
      !f.includes('/scripts/') &&
      !f.includes('/system/internal/')
  )
  const internalFragmentFiles = fragmentFiles.filter((f) => f.includes('/system/internal/'))
  const internalBundles =
    internalFragmentFiles.length > 0
      ? await bundleFragments({ files: internalFragmentFiles })
      : []
  
  // Include generated .mjs files from internal/
  const generatedMjsFiles = [
    join(CLI_ROOT, 'src/system/internal/box.mjs'),
  ]
  const generatedFragments = generatedMjsFiles
    .filter(existsSync)
    .map(file => readFileSync(file, 'utf-8'))
  
  mkdirSync(dirname(INTERNAL_FRAGMENTS_PATH), { recursive: true })
  const concatenated = [
    ...internalBundles.map((b) => `;${b.bundle}`),
    ...generatedFragments.map((content) => `;${content}`)
  ].join('\n')
  writeFileSync(INTERNAL_FRAGMENTS_PATH, concatenated, 'utf-8')

  await createPandaConfig({
    outputPath: PANDA_CONFIG_PATH,
    fragmentFiles: configFragmentFiles,
    collectors: [pandaCollector as FragmentCollector<unknown, unknown>],
    baseConfig: styledBaseConfig,
    internalFragments: concatenated || undefined,
  })

  console.log('[build:styled] Config generated at:', PANDA_CONFIG_PATH)
}

async function runPandaCodegen(): Promise<void> {
  console.log('[build:styled] Running Panda codegen...')

  await pandaGenerate({ cwd: STYLED_DIR }, PANDA_CONFIG_PATH)

  console.log('[build:styled] Panda codegen complete')
}

function createMetadata(fragmentCount: number): StylePackageMetadata {
  const metadata: StylePackageMetadata = {
    fragmentsCollected: fragmentCount,
    outputPath: STYLED_DIR,
    generatedAt: new Date().toISOString(),
  }

  const metadataPath = join(STYLED_DIR, 'metadata.json')
  mkdirSync(STYLED_DIR, { recursive: true })
  writeFileSync(metadataPath, JSON.stringify(metadata, null, 2), 'utf-8')

  console.log('[build:styled] Metadata saved')
  return metadata
}

async function buildStyledPackage(): Promise<void> {
  try {
    console.log('[build:styled] Starting styled package build...\n')

    mkdirSync(STYLED_DIR, { recursive: true })

    const { fragmentFiles } = await collectTokenFragments()
    await generateStyleConfig(fragmentFiles)
    await runPandaCodegen()
    createMetadata(fragmentFiles.length)

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

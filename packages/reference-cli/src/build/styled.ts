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
import { mkdirSync, writeFileSync } from 'node:fs'
import { collectFragments, scanForFragments } from '../lib/fragments'
import { createPandaConfig } from '../system/config/createPandaConfig'
import { tokensCollector } from '../system/api/tokens'
import { spawnSync } from 'node:child_process'

const __filename = fileURLToPath(import.meta.url)
const CLI_ROOT = resolve(dirname(__filename), '../..')
const STYLED_DIR = join(CLI_ROOT, 'src/system/styled')
const PANDA_CONFIG_PATH = join(STYLED_DIR, 'panda.config.ts')

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

  console.log(`[build:styled] Found ${fragmentFiles.length} fragment files`)

  if (fragmentFiles.length === 0) {
    console.log('[build:styled] No token fragments found, using defaults')
    return { fragmentFiles: [], collectedTokens: [] }
  }

  const tempDir = join(STYLED_DIR, '.tmp')

  const result = await collectFragments({
    files: fragmentFiles,
    collector: tokensCollector,
    tempDir,
  })

  console.log('[build:styled] Collected tokens:', result.length)

  return { fragmentFiles, collectedTokens: result }
}

async function generateStyleConfig(fragmentFiles: string[]): Promise<void> {
  console.log('[build:styled] Generating panda.config.ts...')

  const styledBaseConfig = {
    preflight: false,
    outdir: '.', // Output directly to system/styled
    include: ['./src/**/*.{ts,tsx}'],
    exclude: ['**/*.d.ts'],
  }

  const configFragmentFiles = fragmentFiles.filter(
    f => !f.includes('/build/') && !f.includes('/system/styled/') && !f.includes('/scripts/')
  )

  await createPandaConfig({
    outputPath: PANDA_CONFIG_PATH,
    fragmentFiles: configFragmentFiles,
    collectors: [tokensCollector],
    baseConfig: styledBaseConfig,
  })

  console.log('[build:styled] Config generated at:', PANDA_CONFIG_PATH)
}

function runPandaCodegen(): void {
  console.log('[build:styled] Running Panda codegen...')

  const pandaBin = join(CLI_ROOT, 'node_modules', '.bin', 'panda')

  const result = spawnSync(pandaBin, ['codegen', '--silent'], {
    cwd: STYLED_DIR,
    stdio: 'pipe',
  })

  if (result.status !== 0) {
    const stderr = result.stderr?.toString() ?? ''
    const stdout = result.stdout?.toString() ?? ''
    console.error('[build:styled] Panda codegen failed:', stderr || stdout)
    throw new Error(`Panda codegen failed: ${stderr || stdout || result.status}`)
  }

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
    runPandaCodegen()
    createMetadata(fragmentFiles.length)

    console.log('\n[build:styled] ✓ Styled package built successfully!')
    console.log(`[build:styled] Output: ${STYLED_DIR}`)
  } catch (error) {
    console.error('\n[build:styled] ✗ Build failed:', error)
    process.exit(1)
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  buildStyledPackage()
}

export { buildStyledPackage }

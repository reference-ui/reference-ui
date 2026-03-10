#!/usr/bin/env node
/**
 * Build script for generating the internal styled package.
 *
 * 1. Scans for files that import the system API
 * 2. Prepares collector runtime + bundled fragments, then generates panda.config.ts
 * 3. Runs Panda to output styled package to ./src/system/styled/
 */

import { resolve, join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { mkdirSync, writeFileSync } from 'node:fs'
import { generate as pandaGenerate } from '@pandacss/node'
import { generateStyledConfig, getFragmentFiles } from './config'

const __filename = fileURLToPath(import.meta.url)
const CORE_ROOT = resolve(dirname(__filename), '../../../..')
const STYLED_DIR = join(CORE_ROOT, 'src/system/styled')
const PANDA_CONFIG_PATH = join(STYLED_DIR, 'panda.config.ts')
const systemEntry = join(CORE_ROOT, 'src/entry/system.ts')

async function runPandaCodegen(): Promise<void> {
  console.log('[build:styled] Running Panda codegen...')
  await pandaGenerate({ cwd: STYLED_DIR }, PANDA_CONFIG_PATH)
  console.log('[build:styled] Panda codegen complete')
}

export async function buildStyledPackage(): Promise<void> {
  try {
    console.log('[build:styled] Starting styled package build...\n')
    mkdirSync(STYLED_DIR, { recursive: true })

    const fragmentFiles = await getFragmentFiles(CORE_ROOT)
    await generateStyledConfig({
      coreRoot: CORE_ROOT,
      styledDir: STYLED_DIR,
      pandaConfigPath: PANDA_CONFIG_PATH,
      systemEntry,
      fragmentFiles
    })
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

/**
 * Vitest globalSetup: emit test bundles using the compiled napi-rs runtime
 * so that bundle tests load real native output instead of Rust-test-produced files.
 */
import { execFileSync } from 'node:child_process'
import { readdirSync, writeFileSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { pathToFileURL } from 'node:url'

import {
  getVirtualNative,
  resolveReferenceRsPackageDir,
  scanAndEmitBundle,
} from '../js/runtime/index'

const __dirname = fileURLToPath(new URL('.', import.meta.url))

export default async function globalSetup() {
  if (!getVirtualNative()) {
    throw new Error(
      'Virtual native addon not available. Run `pnpm run ensure-native` (or `pnpm run build`) first.'
    )
  }

  const packageDir = resolveReferenceRsPackageDir(pathToFileURL(__dirname).href)
  const inputDir = join(packageDir, 'tests', 'input')
  const outputDir = join(packageDir, 'tests', 'output')

  // Install fixture deps so scanner can resolve node_modules
  execFileSync('npm', ['install', '--no-audit', '--no-fund'], {
    cwd: inputDir,
    stdio: 'inherit',
  })

  const scenarioFolders = readdirSync(inputDir, { withFileTypes: true })
    .filter((e) => e.isDirectory() && e.name !== 'node_modules')
    .map((e) => e.name)
    .sort()

  if (scenarioFolders.length === 0) {
    throw new Error('At least one scenario folder must exist under tests/input/')
  }

  for (const scenario of scenarioFolders) {
    const include = [`${scenario}/**/*.{ts,tsx}`]
    const bundleSource = scanAndEmitBundle(inputDir, include)
    const scenarioOutputDir = join(outputDir, scenario)
    mkdirSync(scenarioOutputDir, { recursive: true })
    writeFileSync(join(scenarioOutputDir, 'bundle.js'), bundleSource + '\n', 'utf-8')
  }
}

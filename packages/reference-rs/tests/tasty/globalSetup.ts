/**
 * Vitest globalSetup: emit test bundles using the compiled napi-rs runtime
 * so that bundle tests load real native output instead of Rust-test-produced files.
 */
import { execFileSync } from 'node:child_process'
import { readdirSync, writeFileSync, mkdirSync } from 'node:fs'
import { performance } from 'node:perf_hooks'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { pathToFileURL } from 'node:url'

import {
  getVirtualNative,
  resolveReferenceRsPackageDir,
  scanAndEmitBundle,
} from '../../js/runtime/index'

const __dirname = fileURLToPath(new URL('.', import.meta.url))

export default async function globalSetup() {
  if (!getVirtualNative()) {
    throw new Error(
      'Virtual native addon not available. Run `pnpm run ensure-native` (or `pnpm run build`) first.'
    )
  }

  const packageDir = resolveReferenceRsPackageDir(pathToFileURL(__dirname).href)
  const tastyDir = join(packageDir, 'tests', 'tasty')
  const casesDir = join(tastyDir, 'cases')

  // Install fixture deps so scanner can resolve node_modules
  execFileSync('npm', ['install', '--no-audit', '--no-fund'], {
    cwd: tastyDir,
    stdio: 'inherit',
  })

  const scenarioFolders = readdirSync(casesDir, { withFileTypes: true })
    .filter((e) => e.isDirectory() && e.name !== 'node_modules')
    .map((e) => e.name)
    .sort()

  if (scenarioFolders.length === 0) {
    throw new Error('At least one case folder must exist under tests/tasty/cases/')
  }

  for (const scenario of scenarioFolders) {
    const include = [`cases/${scenario}/input/**/*.{ts,tsx}`]
    const scenarioOutputDir = join(casesDir, scenario, 'output')
    const startedAt = performance.now()
    const bundleSource = scanAndEmitBundle(tastyDir, include)
    const rustApiMs = performance.now() - startedAt

    mkdirSync(scenarioOutputDir, { recursive: true })
    writeFileSync(join(scenarioOutputDir, 'bundle.js'), bundleSource + '\n', 'utf-8')
    writeFileSync(
      join(scenarioOutputDir, 'perf-metrics.txt'),
      [
        '// perf metrics',
        `// rust_api_ms: ${rustApiMs.toFixed(3)}`,
        `// include: ${include[0]}`,
        '// note: measured around the native scanAndEmitBundle call only',
        '',
      ].join('\n'),
      'utf-8'
    )
  }
}

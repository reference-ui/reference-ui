/**
 * Vitest globalSetup: emit test Tasty artifacts using the compiled napi-rs runtime
 * so that bundle/runtime tests load real native output instead of Rust-test-produced files.
 */
import { execFileSync } from 'node:child_process'
import { mkdirSync, readdirSync, writeFileSync } from 'node:fs'
import { performance } from 'node:perf_hooks'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { pathToFileURL } from 'node:url'

import {
  getVirtualNative,
  resolveReferenceRsPackageDir,
  scanAndEmitModules,
} from '../../js/runtime/index'

const __dirname = fileURLToPath(new URL('.', import.meta.url))

interface EmittedModulesPayload {
  entrypoint: string
  modules: Record<string, string>
  type_declarations: Record<string, string>
}

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
    const emitted = JSON.parse(scanAndEmitModules(tastyDir, include)) as EmittedModulesPayload
    const rustApiMs = performance.now() - startedAt

    mkdirSync(scenarioOutputDir, { recursive: true })
    for (const [relativeModulePath, source] of Object.entries(emitted.modules)) {
      const outputPath = join(scenarioOutputDir, relativeModulePath.replace(/^\.\//, ''))
      mkdirSync(dirname(outputPath), { recursive: true })
      writeFileSync(outputPath, source + '\n', 'utf-8')
    }
    writeFileSync(
      join(scenarioOutputDir, 'perf-metrics.txt'),
      [
        '// perf metrics',
        `// rust_api_ms: ${rustApiMs.toFixed(3)}`,
        `// include: ${include[0]}`,
        '// note: measured around the native scanAndEmitModules call only',
        '',
      ].join('\n'),
      'utf-8'
    )
  }
}

/**
 * Vanilla worker: setup benchmark project, spawn build, track memory.
 */

import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { log } from '../lib/log'
import { spawnMonitoredAsync } from '../lib/child-process'
import { resolveCorePackageDir } from '../lib/resolve-core'
import { createBenchmarkProject } from './setup'
import type { VanillaWorkerPayload } from './types'

const __dirname = dirname(fileURLToPath(import.meta.url))

/**
 * Run Vanilla Extract benchmark: create project, spawn build, report memory.
 */
export async function runVanilla(payload: VanillaWorkerPayload): Promise<void> {
  const { cwd, benchDir = '.ref/vanilla-bench' } = payload
  const coreDir = resolveCorePackageDir(cwd)
  const absBenchDir = resolve(coreDir, benchDir)

  const stressFiles = payload.stressFiles ?? 500
  const stressStylesPerFile = payload.stressStylesPerFile ?? 20

  const bench = await createBenchmarkProject(absBenchDir, {
    stressFiles,
    stressStylesPerFile,
  })

  if (bench.themeFile) {
    log.info(
      `[vanilla] Generated ${bench.fileCount} files ` +
        `(1 theme, ${bench.componentFiles} components, 1 entry) | ` +
        `${bench.totalStyles} styles total`
    )
  } else {
    log.info(`[vanilla] Generated ${bench.fileCount} files (minimal)`)
  }

  const runnerPath = resolve(__dirname, 'runner.mjs')
  log.debug('vanilla:worker', 'Spawning VE build', runnerPath)

  const result = await spawnMonitoredAsync(
    process.execPath,
    [runnerPath, absBenchDir],
    {
      processName: 'vanilla-extract',
      cwd: absBenchDir,
      logCategory: 'vanilla:worker',
      logMemory: true,
    }
  )

  log.info(
    `[vanilla-extract] Peak RSS: ${result.peakChildRssMb.toFixed(1)}MB | ` +
      `Parent delta: ${result.parentRssDeltaMb.toFixed(1)}MB ` +
      `(cf. Panda ~250MB)`
  )
}

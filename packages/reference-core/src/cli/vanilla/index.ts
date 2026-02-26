/**
 * Vanilla Extract module
 * Benchmark VE build and report memory consumption.
 */

import { initLog } from '../lib/log'
import { initEventBus } from '../event-bus'
import { loadUserConfig } from '../config'
import { runWorker, shutdown } from '../thread-pool'

export { initVanilla } from './init'
export type { InitVanillaOptions, VanillaWorkerPayload } from './types'

/**
 * Run the Vanilla benchmark as a CLI command.
 * Default: full stress test (50 files × 20 styles). Use --minimal for quick run.
 */
export async function vanillaCommand(
  cwd: string,
  options?: { minimal?: boolean; files?: string; stylesPerFile?: string }
): Promise<void> {
  const config = await loadUserConfig(cwd)
  initEventBus()
  initLog(config)

  const stressFiles = options?.minimal
    ? 0
    : parseInt(options?.files ?? '500', 10) || 500
  const stressStylesPerFile = parseInt(options?.stylesPerFile ?? '20', 10) || 20

  await runWorker('vanilla', {
    cwd,
    config,
    benchDir: '.ref/vanilla-bench',
    stressFiles,
    stressStylesPerFile,
  })
  await shutdown()
}

import { rm } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { loadUserConfig, setConfig } from '../config'
import { getOutDirPath } from '../lib/paths'
import { log, setDebug } from '../lib/log'

/**
 * Clean command – removes the outDir (.reference-ui by default, or config.outDir).
 * Runs entirely in main thread. Use before tests to get a fresh state.
 */
export async function cleanCommand(cwd: string = process.cwd()): Promise<void> {
  const config = await loadUserConfig(cwd)
  setConfig(config)
  if (config.debug) setDebug(true)

  const outDirPath = getOutDirPath(cwd)

  if (!existsSync(outDirPath)) {
    log.debug('clean', 'Out dir does not exist, nothing to remove')
    process.exit(0)
  }

  await rm(outDirPath, { recursive: true })
  log.info(`Cleaned ${outDirPath}`)
  process.exit(0)
}

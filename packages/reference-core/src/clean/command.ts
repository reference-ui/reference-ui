import { rm } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { loadUserConfig, setConfig } from '../config'
import { getOutDirPath } from '../lib/paths'
import { log } from '../lib/log'
import { removeSymlinkOrDir } from '../lib/symlink'
import { PACKAGES } from '../packager/packages'
import { getShortName } from '../packager/layout'

/**
 * Clean command – removes the outDir (.reference-ui by default, or config.outDir).
 * Runs entirely in main thread. Use before tests to get a fresh state.
 */
export async function cleanCommand(cwd: string = process.cwd()): Promise<void> {
  const config = await loadUserConfig(cwd)
  setConfig(config)

  const outDirPath = getOutDirPath(cwd)
  const nodeModulesScope = resolve(cwd, 'node_modules', '@reference-ui')

  if (!existsSync(outDirPath) && !existsSync(nodeModulesScope)) {
    log.debug('clean', 'Out dir does not exist, nothing to remove')
    process.exit(0)
  }

  if (existsSync(outDirPath)) {
    await rm(outDirPath, { recursive: true, force: true })
  }

  for (const pkg of PACKAGES) {
    removeSymlinkOrDir(resolve(nodeModulesScope, getShortName(pkg.name)))
  }

  log.info(`Cleaned ${outDirPath}`)
  process.exit(0)
}

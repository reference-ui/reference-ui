import type { Config } from '@pandacss/dev'
import { resolve } from 'node:path'
import { scanDirectories } from './scanner'
import { runFiles } from './runner'
import { log } from '../../lib/log'

/**
 * Run eval: execute base file(s) first, then scan directories for registered
 * function calls. All contribute via extendPandaConfig to the collector.
 *
 * @param coreDir - Package root (e.g. reference-core)
 * @param directories - Paths to scan, relative to coreDir (e.g. ['src/styled'])
 * @param baseFiles - Optional paths (relative to coreDir) run first, e.g. ['panda.base.ts']
 */
export async function runEval(
  coreDir: string,
  directories: string[],
  baseFiles: string[] = []
): Promise<Partial<Config>[]> {
  const basePaths = baseFiles.map(f => resolve(coreDir, f))
  const resolvedDirs = directories.map(d => resolve(coreDir, d))
  const scannedFiles = scanDirectories(resolvedDirs)
  const files = [...basePaths, ...scannedFiles]

  const result = await runFiles(files, coreDir)
  log.debug(
    'eval',
    `Collected ${result.length} config fragments from ${files.length} files`
  )

  return result
}

export { REGISTERED_FUNCTIONS, isRegistered } from './registry'
export { scanDirectories } from './scanner'
export { runFiles } from './runner'

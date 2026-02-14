import type { Config } from '@pandacss/dev'
import { resolve } from 'node:path'
import { scanDirectories } from './scanner'
import { runFiles } from './runner'

/**
 * Run eval: scan the given directories (relative to coreDir) for registered
 * function calls, execute those files, and return the collected config fragments.
 *
 * @param coreDir - Package root (e.g. reference-core)
 * @param directories - Paths to scan, relative to coreDir (e.g. ['src/styled'])
 */
export async function runEval(
  coreDir: string,
  directories: string[]
): Promise<Partial<Config>[]> {
  const resolvedDirs = directories.map((d) => resolve(coreDir, d))
  const files = scanDirectories(resolvedDirs)
  return runFiles(files, coreDir)
}

export { REGISTERED_FUNCTIONS, isRegistered } from './registry'
export { scanDirectories } from './scanner'
export { runFiles } from './runner'

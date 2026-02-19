import { bundleNRequire } from 'bundle-n-require'
import { dirname } from 'node:path'
import { COLLECTOR_KEY } from '../panda/config/extendPandaConfig'
import type { Config } from '@pandacss/dev'

/**
 * Run the given files and collect config fragments from extendPandaConfig.
 * Sets a global collector before each file run; when the file calls
 * extendPandaConfig(partial), the partial is pushed to the collector.
 */
export async function runFiles(
  filePaths: string[],
  cwd: string
): Promise<Partial<Config>[]> {
  const allFragments: Partial<Config>[] = []

  for (const filePath of filePaths) {
    const collector: Partial<Config>[] = []
    ;(globalThis as Record<string, unknown>)[COLLECTOR_KEY] = collector

    try {
      await bundleNRequire(filePath, {
        cwd,
        interopDefault: true,
      })
    } finally {
      delete (globalThis as Record<string, unknown>)[COLLECTOR_KEY]
    }

    allFragments.push(...collector)
  }

  return allFragments
}

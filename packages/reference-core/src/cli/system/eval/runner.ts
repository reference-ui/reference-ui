import { COLLECTOR_KEY } from '../config/extendPandaConfig'
import { microBundle } from '../../lib/microbundle'
import type { Config } from '@pandacss/dev'
import { log } from '../../lib/log'

/**
 * Run the given files and collect config fragments from extendPandaConfig.
 * Sets a global collector before each file run; when the file calls
 * extendPandaConfig(partial), the partial is pushed to the collector.
 */
export async function runFiles(
  filePaths: string[],
  _cwd: string
): Promise<Partial<Config>[]> {
  const allFragments: Partial<Config>[] = []

  for (const filePath of filePaths) {
    const collector: Partial<Config>[] = []
    ;(globalThis as Record<string, unknown>)[COLLECTOR_KEY] = collector

    try {
      const bundled = await microBundle(filePath)
      const encoded = Buffer.from(bundled, 'utf-8').toString('base64')
      const cacheKey = `${filePath}-${Date.now()}-${Math.random()}`
      const url = `data:text/javascript;base64,${encoded}#${cacheKey}`
      await import(url)
    } finally {
      delete (globalThis as Record<string, unknown>)[COLLECTOR_KEY]
    }

    allFragments.push(...collector)
  }

  return allFragments
}

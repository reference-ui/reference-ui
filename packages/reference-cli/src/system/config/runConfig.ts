import { join } from 'node:path'
import { getOutDirPath } from '../../lib/paths'
import { scanForFragments } from '../../lib/fragments'
import { createPandaConfig } from './createPandaConfig'
import { getConfig } from '../../config/store'
import { log } from '../../lib/log'
import type { FragmentCollector } from '../../lib/fragments'

/** Default collectors for panda config. Empty for bootstrap; extend when adding tokens/recipe etc. */
const DEFAULT_PANDA_COLLECTORS: FragmentCollector<unknown>[] = []

/**
 * Run config generation: scan for fragments, write panda.config to outDir.
 * Caller (config worker or main thread) is responsible for emitting system:config:complete.
 */
export async function runConfig(cwd: string): Promise<void> {
  log.debug('config', 'runConfig started', { cwd })
  const config = getConfig()
  if (!config) {
    throw new Error('runConfig: getConfig() is undefined')
  }

  const outDir = getOutDirPath(cwd)
  const outputPath = join(outDir, 'panda.config.ts')

  const functionNames = DEFAULT_PANDA_COLLECTORS.map(
    c => c.config.targetFunction
  ).filter((name): name is string => Boolean(name))

  const fragmentFiles =
    functionNames.length > 0
      ? scanForFragments({
          include: config.include,
          functionNames,
          cwd,
        })
      : []

  await createPandaConfig({
    outputPath,
    fragmentFiles,
    collectors: DEFAULT_PANDA_COLLECTORS,
  })

  log.debug('config', 'Wrote panda.config', outputPath)
}

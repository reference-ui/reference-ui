import { join } from 'node:path'
import { getCwd } from '../../../config'
import { getOutDirPath } from '../../../lib/paths'
import { resolveCorePackageDir } from '../../../lib/paths/core-package-dir'
import { emit } from '../../../lib/event-bus'
import { createPandaConfig } from './create'
import { getConfig } from '../../../config/store'
import { log } from '../../../lib/log'
import { createBaseArtifacts } from '../../base/create'
import {
  mirrorPandaExtensionsBundle,
  writePandaExtensionsBundle,
} from './extensions/api/bundle'

const SYSTEM_CONFIG_COMPLETE_EVENT = 'system:config:complete'
const SYSTEM_CONFIG_FAILED_EVENT = 'system:config:failed'

/**
 * Run config generation: prepare the portable base-system artefact,
 * then use its collector bundle to write panda.config.ts.
 */
export async function runConfig(cwd: string): Promise<void> {
  log.debug('config', 'runConfig started', { cwd })
  const config = getConfig()
  if (!config) {
    throw new Error('runConfig: getConfig() is undefined')
  }

  const outDir = getOutDirPath(cwd)
  const outputPath = join(outDir, 'panda.config.ts')
  const cliDir = resolveCorePackageDir(cwd)
  const cliStyledDir = join(cliDir, 'src/system/styled')
  const { collectorBundle } = await createBaseArtifacts(cwd, config)

  await writePandaExtensionsBundle(cliDir, cliStyledDir)
  mirrorPandaExtensionsBundle(cliStyledDir, outDir)

  await createPandaConfig({
    outputPath,
    collectorBundle,
    extensionsImportPath: './styled/extensions/index.mjs',
  })

  log.debug('config', 'Wrote panda.config', outputPath)
}

/**
 * Handler for run:system:config. Resolves cwd, runs config generation.
 * Emits system:config:complete only on success; system:config:failed on missing cwd or runConfig failure.
 */
export function onRunConfig(): void {
  const cwd = getCwd()
  if (!cwd) {
    log.error('[config] run:system:config: getCwd() is undefined')
    emit(SYSTEM_CONFIG_FAILED_EVENT)
    return
  }
  log.debug('config', 'run:system:config received', cwd)
  runConfig(cwd)
    .then(() => {
      log.debug('config', `runConfig done → ${SYSTEM_CONFIG_COMPLETE_EVENT}`)
      emit(SYSTEM_CONFIG_COMPLETE_EVENT)
    })
    .catch((err) => {
      log.error(
        '[config] runConfig failed',
        err instanceof Error ? err.message : String(err),
        err instanceof Error ? err.stack : ''
      )
      emit(SYSTEM_CONFIG_FAILED_EVENT)
    })
}

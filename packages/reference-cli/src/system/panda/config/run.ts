import { join } from 'node:path'
import { getCwd } from '../../../config'
import { getOutDirPath } from '../../../lib/paths'
import { resolveCliPackageDir } from '../../../lib/paths/cli-package-dir'
import { emit } from '../../../lib/event-bus'
import { createPandaConfig } from './create'
import { getConfig } from '../../../config/store'
import { log } from '../../../lib/log'
import {
  mirrorPandaExtensionsBundle,
  writePandaExtensionsBundle,
} from './extensions/api/bundle'
import { createCollectorBundleForConfig } from './fragments'

/**
 * Run config generation: scan for fragment files that import the system API,
 * prepare a collector bundle runtime, then write panda.config.ts.
 * When the generated file is loaded, the bundled fragment IIFEs call
 * the injected runtime functions and the collected values are merged
 * into defineConfig().
 */
export async function runConfig(cwd: string): Promise<void> {
  log.debug('config', 'runConfig started', { cwd })
  const config = getConfig()
  if (!config) {
    throw new Error('runConfig: getConfig() is undefined')
  }

  const outDir = getOutDirPath(cwd)
  const outputPath = join(outDir, 'panda.config.ts')
  const cliDir = resolveCliPackageDir(cwd)
  const cliStyledDir = join(cliDir, 'src/system/styled')
  const collectorBundle = await createCollectorBundleForConfig(cwd, config)

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
 * Handler for run:system:config. Resolves cwd, runs config generation, always emits system:config:complete.
 */
export function onRunConfig(): void {
  const cwd = getCwd()
  if (!cwd) {
    log.error('[config] run:system:config: getCwd() is undefined')
    emit('system:config:complete')
    return
  }
  log.debug('config', 'run:system:config received', cwd)
  runConfig(cwd)
    .then(() => {
      log.debug('config', 'runConfig done → system:config:complete')
      emit('system:config:complete')
    })
    .catch((err) => {
      log.error(
        '[config] runConfig failed',
        err instanceof Error ? err.message : String(err),
        err instanceof Error ? err.stack : ''
      )
      emit('system:config:complete')
    })
}

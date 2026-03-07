import { join } from 'node:path'
import { getCwd } from '../../../config'
import { getOutDirPath } from '../../../lib/paths'
import { resolveCliPackageDir } from '../../../lib/paths/cli-package-dir'
import type { FragmentCollector } from '../../../lib/fragments'
import { scanForFragments } from '../../../lib/fragments'
import { emit } from '../../../lib/event-bus'
import { createPandaConfig } from './createPandaConfig'
import { getConfig } from '../../../config/store'
import { log } from '../../../lib/log'
import { createTokensCollector } from '../../api/tokens'

/**
 * Run config generation: scan for fragment files that call tokens(),
 * then createPandaConfig bundles them and writes panda.config.ts with
 * collector setup + injected bundle JS. When the file is loaded, the
 * bundles run and call tokens(); the generated file reads the collector
 * and merges into defineConfig().
 */
export async function runConfig(cwd: string): Promise<void> {
  log.debug('config', 'runConfig started', { cwd })
  const config = getConfig()
  if (!config) {
    throw new Error('runConfig: getConfig() is undefined')
  }

  const outDir = getOutDirPath(cwd)
  const outputPath = join(outDir, 'panda.config.ts')

  const fragmentFiles = scanForFragments({
    include: config.include,
    functionNames: ['tokens'],
    cwd,
  })

  const cliDir = resolveCliPackageDir(cwd)
  const systemEntry = join(cliDir, 'src/entry/system.ts')
  const fragmentBundleAlias: Record<string, string> = {
    '@reference-ui/system': systemEntry,
    '@reference-ui/cli/config': systemEntry,
  }

  await createPandaConfig({
    outputPath,
    fragmentFiles,
    collector: createTokensCollector() as FragmentCollector,
    fragmentBundleAlias,
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

import { join } from 'node:path'
import { readFileSync, existsSync } from 'node:fs'
import { getCwd } from '../../config'
import { getOutDirPath } from '../../lib/paths'
import { resolveCliPackageDir } from '../../lib/paths/cli-package-dir'
import { scanForFragments } from '../../lib/fragments'
import { emit } from '../../lib/event-bus'
import { createPandaConfig } from './createPandaConfig'
import { getConfig } from '../../config/store'
import { log } from '../../lib/log'
import {
  createPandaConfigCollector,
} from '../collectors/extendPandaConfig'
import { getFontFragmentsForConfig } from '../font'
import { getPatternFragmentsForConfig } from '../patterns'
import type { FragmentCollector } from '../../lib/fragments'

const INTERNAL_FRAGMENTS_FILENAME = 'internal-fragments.mjs'

/** Single panda config collector. tokens() and other APIs call extendPandaConfig; this captures partials. */
const PANDA_CONFIG_COLLECTOR = createPandaConfigCollector() as FragmentCollector<unknown>

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

  const functionNames = [PANDA_CONFIG_COLLECTOR.config.targetFunction].filter(
    (name): name is string => Boolean(name)
  )

  const fragmentFiles =
    functionNames.length > 0
      ? scanForFragments({
          include: config.include,
          functionNames,
          cwd,
        })
      : []

  let internalFragments: string | undefined
  try {
    const cliDir = resolveCliPackageDir(cwd)
    const internalPath = join(cliDir, 'dist/cli/styled', INTERNAL_FRAGMENTS_FILENAME)
    if (existsSync(internalPath)) {
      internalFragments = readFileSync(internalPath, 'utf-8')
    }
  } catch {
    // CLI not found or file missing — skip internal fragments
  }

  const cliDir = resolveCliPackageDir(cwd)
  const systemEntry = join(cliDir, 'src/entry/system.ts')
  const fragmentBundleAlias: Record<string, string> = {
    '@reference-ui/system': systemEntry,
    '@reference-ui/cli/config': systemEntry,
  }

  const tempDir = join(outDir, '.tmp')
  const { fontConfigFragments } = await getFontFragmentsForConfig({
    cwd,
    userInclude: config.include,
    tempDir,
    fragmentBundleAlias: { '@reference-ui/cli/config': systemEntry },
  })

  const patternFragments = await getPatternFragmentsForConfig({
    cwd,
    cliDir,
    userInclude: config.include,
    tempDir,
  })

  await createPandaConfig({
    outputPath,
    fragmentFiles,
    collectors: [PANDA_CONFIG_COLLECTOR],
    internalFragments,
    fontConfigFragments: fontConfigFragments || undefined,
    patternFragments: patternFragments ?? undefined,
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

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
import { tokensCollector } from '../api/tokens'
import type { FragmentCollector } from '../../lib/fragments'

const INTERNAL_FRAGMENTS_FILENAME = 'internal-fragments.mjs'

/** Default collectors for panda config. Extend when adding recipe/utilities/etc. */
const DEFAULT_PANDA_COLLECTORS: FragmentCollector<unknown>[] = [
  tokensCollector as FragmentCollector<unknown>,
]

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
  const fragmentBundleAlias: Record<string, string> = {
    '@reference-ui/system': join(cliDir, 'src/entry/system.ts'),
  }

  await createPandaConfig({
    outputPath,
    fragmentFiles,
    collectors: DEFAULT_PANDA_COLLECTORS,
    internalFragments,
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

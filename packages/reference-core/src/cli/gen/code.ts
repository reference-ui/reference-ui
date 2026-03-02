import { existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { generate } from '@pandacss/node'
import { emit } from '../event-bus'
import { log } from '../lib/log'
import { debounce } from '../lib/debounce'
import { createBaseSystem } from '../system/config/baseSystem/createBaseSystem'
import { resolveCorePackageDir } from '../lib/resolve-core'
import { getSystemPackageDir } from '../packager/install'
import type { ReferenceUIConfig } from '@reference-ui/cli/config'

/**
 * Run Panda full pipeline: codegen (TS utilities) + CSS extraction.
 * Then createBaseSystem (needs styles.css for createLayerCss).
 * Emits system:compiled (build ready; packager does full install including styles).
 *
 * @param cwd - Project root (where ui.config lives). Panda config is in coreDir.
 */
export async function runCodegen(cwd: string, config: ReferenceUIConfig): Promise<void> {
  const coreDir = resolveCorePackageDir(cwd)
  const configPath = resolve(coreDir, 'panda.config.ts')
  if (!existsSync(configPath)) {
    throw new Error(`panda.config.ts not found at ${configPath}. Run createPandaConfig first.`)
  }
  log.debug('gen:code', 'Starting Panda...')
  await generate({ cwd: coreDir }, configPath)

  const userDirs = config.include.map(p =>
    resolve(cwd, p.split('**')[0].replace(/\/+$/, ''))
  )
  await createBaseSystem(coreDir, userDirs, config, getSystemPackageDir(cwd))

  emit('gen:complete', {})
  emit('system:compiled', { config })
}

/** Returns a debounced handler for config:ready. Uses config from event when provided (ui.config reload). */
export function onConfigReady(
  cwd: string,
  fallbackConfig: ReferenceUIConfig
): (evt?: { config?: ReferenceUIConfig }) => void {
  const run = (cfg: ReferenceUIConfig) =>
    runCodegen(cwd, cfg).catch(e => log.error('[gen:code] failed:', e))
  const debounced = debounce(
    (...args: unknown[]) => run(args[0] as ReferenceUIConfig),
    150
  )
  return (evt?: { config?: ReferenceUIConfig }) => {
    debounced(evt?.config ?? fallbackConfig)
  }
}

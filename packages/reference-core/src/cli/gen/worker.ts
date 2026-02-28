import { on, emit } from '../event-bus'
import { log } from '../lib/log'
import { debounce } from '../lib/debounce'
import { resolveCorePackageDir } from '../lib/resolve-core'
import {
  runPandaCodegen,
  runPandaCssGen,
} from './runner'
import type { ReferenceUIConfig } from '../config'

export interface GenWorkerPayload {
  cwd: string
  config: ReferenceUIConfig
  /** When true, stay alive and react to virtual:fs:change / config:ready */
  watchMode?: boolean
}

async function runPandaAndEmit(coreDir: string): Promise<void> {
  try {
    log.debug('gen:worker', 'Running codegen (full rebuild)')
    await runPandaCodegen(coreDir)
    log.debug('gen:worker', 'Codegen complete → emit system:compiled')
    emit('system:compiled', {})
    emit('panda:stylecss:change', {})
  } catch (e) {
    log.error('[gen:worker] Panda codegen failed:', e)
  }
}

async function runCssGenAndEmit(coreDir: string): Promise<void> {
  try {
    log.debug('gen:worker', 'Running cssgen')
    await runPandaCssGen(coreDir)
    log.debug('gen:worker', 'Cssgen complete → emit system:compiled')
    emit('system:compiled', {})
    emit('panda:stylecss:change', {})
  } catch (e) {
    log.error('[gen:worker] Panda cssgen failed:', e)
  }
}

/**
 * Gen worker - runs Panda (codegen / cssgen) in its own thread.
 *
 * - virtual:fs:change → cssgen (immediate, no debounce)
 * - config:ready → codegen (debounced; system rebuilt config)
 */
export async function runGen(payload: GenWorkerPayload): Promise<void> {
  const { cwd, watchMode = false } = payload
  const coreDir = resolveCorePackageDir(cwd)

  log.debug('gen:worker', watchMode ? 'Bootstrap (watch mode)' : 'Bootstrap (one-shot)')

  if (watchMode) {
    const debouncedCodegen = debounce(() => runPandaAndEmit(coreDir), 150)

    on('virtual:fs:change', () => {
      log.debug('gen:worker', 'virtual:fs:change → cssgen')
      runCssGenAndEmit(coreDir)
    })

    on('config:ready', () => {
      log.debug('gen:worker', 'config:ready → schedule codegen')
      debouncedCodegen()
    })

    log.debug('gen:worker', 'Listening for virtual:fs:change, config:ready')
    emit('gen:ready', {})
    return new Promise(() => {})
  }

  // One-shot: system has already run config, gen runs codegen
  log.debug('gen:worker', 'Running codegen (one-shot)')
  await runPandaCodegen(coreDir)
  log.debug('gen:worker', 'Codegen complete → emit system:compiled')
  emit('system:compiled', {})
}

export default runGen

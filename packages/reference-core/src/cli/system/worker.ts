import { resolveCorePackageDir } from '../lib/resolve-core'
import type { ReferenceUIConfig } from '../config'
import { runEval } from './eval'
import { createPandaConfig } from './config'
import { runPandaCodegen, runPandaCss } from './gen/runner'
import { resolve } from 'node:path'
import { on, emit } from '../event-bus'
import { log } from '../lib/log'

export interface SystemWorkerPayload {
  cwd: string
  config: ReferenceUIConfig
  /** When true, stay alive and recompile on virtual:fs:change */
  watchMode?: boolean
}

async function runSystemCore(payload: SystemWorkerPayload): Promise<void> {
  const { cwd, config } = payload
  const coreDir = resolveCorePackageDir()

  const coreDirs = ['src/styled']
  const userDirs = config.include.map(pattern => {
    const baseDir = pattern.split('**')[0].replace(/\/+$/, '')
    return resolve(cwd, baseDir)
  })

  const fragments = await runEval(coreDir, [...coreDirs, ...userDirs], ['panda.base.ts'])
  if (fragments.length > 0 && config.include.length > 0) {
    await createPandaConfig(coreDir, { userDirectories: userDirs })
  }

  runPandaCodegen(coreDir)
  runPandaCss(coreDir)
  emit('system:compiled', {})
}

function debounce<T extends (...args: unknown[]) => void>(fn: T, ms: number): T {
  let timeout: ReturnType<typeof setTimeout> | null = null
  return ((...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(() => {
      timeout = null
      fn(...args)
    }, ms)
  }) as T
}

export async function runSystem(payload: SystemWorkerPayload): Promise<void> {
  const { watchMode = false } = payload

  await runSystemCore(payload)

  if (watchMode) {
    const debouncedRecompile = debounce(async () => {
      log.debug('[system:worker] virtual:fs:change → recompiling')
      try {
        await runSystemCore(payload)
      } catch (err) {
        log.error('[system:worker] Recompile failed:', err)
      }
    }, 300)
    on('virtual:fs:change', () => debouncedRecompile())

    // Stay alive
    return new Promise(() => {})
  }
}

export default runSystem

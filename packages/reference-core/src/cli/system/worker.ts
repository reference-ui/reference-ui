import { subscribe } from '@parcel/watcher'
import { resolve, join } from 'node:path'
import { on, emit } from '../event-bus'
import { log } from '../lib/log'
import { resolveCorePackageDir } from '../lib/resolve-core'
import { debounce } from '../lib/debounce'
import type { ReferenceUIConfig } from '../config'
import { runEval } from './eval'
import { createPandaConfig } from './config/panda'
import {
  runPandaCodegen,
  runPandaCssGen,
  hashPandaConfig,
} from './gen/runner'

export interface SystemWorkerPayload {
  cwd: string
  config: ReferenceUIConfig
  /** When true, stay alive and recompile on virtual:fs:change */
  watchMode?: boolean
}

const coreDirs = ['src/styled']

async function runConfigOnly(payload: SystemWorkerPayload): Promise<void> {
  const { cwd, config } = payload
  const coreDir = resolveCorePackageDir(cwd)
  const userDirs = config.include.map(p =>
    resolve(cwd, p.split('**')[0].replace(/\/+$/, ''))
  )

  const fragments = await runEval(coreDir, [...coreDirs, ...userDirs], ['panda.base.ts'])
  if (fragments.length > 0 && config.include.length > 0) {
    await createPandaConfig(coreDir, {
      userDirectories: userDirs,
      includeCodegen: true,
    })
  }
}

async function runSystemCore(payload: SystemWorkerPayload): Promise<void> {
  await runConfigOnly(payload)
  const coreDir = resolveCorePackageDir(payload.cwd)
  await runPandaCodegen(coreDir)
  emit('system:compiled', {})
}

export async function runSystem(payload: SystemWorkerPayload): Promise<void> {
  const { watchMode = false } = payload
  const coreDir = resolveCorePackageDir(payload.cwd)

  if (watchMode) {
    await runConfigOnly(payload)

    const debouncedEmit = debounce(() => emit('system:compiled', {}), 200)
    await subscribe(join(coreDir, 'src/system'), (err, events) => {
      if (err) return log.error('[system:worker] Output watcher:', err)
      if (events?.some(ev => ev.path.endsWith('styles.css'))) debouncedEmit()
    })

    // Event-driven: virtual:fs:change → Panda (cssgen when config unchanged, else full generate).
    const debouncedPanda = debounce(async () => {
      log.debug('system:worker', 'virtual:fs:change → Panda')
      try {
        const configHashBefore = hashPandaConfig(coreDir)
        await runConfigOnly(payload)
        const configHashAfter = hashPandaConfig(coreDir)
        const configChanged = configHashBefore !== configHashAfter
        if (configChanged) {
          log.debug('system:worker', 'Config changed → full codegen')
          await runPandaCodegen(coreDir)
        } else {
          await runPandaCssGen(coreDir)
        }
        emit('panda:stylecss:change', {})
      } catch (e) {
        log.error('[system:worker] Panda failed:', e)
      }
    }, 150)
    on('virtual:fs:change', () => debouncedPanda())

    return new Promise(() => {})
  }

  await runSystemCore(payload)
}

export default runSystem

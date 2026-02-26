import { subscribe } from '@parcel/watcher'
import { resolve, join } from 'node:path'
import { on, emit } from '../event-bus'
import { log } from '../lib/log'
import { resolveCorePackageDir } from '../lib/resolve-core'
import type { ReferenceUIConfig } from '../config'
import { runEval } from './eval'
import { createPandaConfig } from './config'
import { runPandaCodegen } from './gen/runner'

export interface SystemWorkerPayload {
  cwd: string
  config: ReferenceUIConfig
  /** When true, stay alive and recompile on virtual:fs:change */
  watchMode?: boolean
}

const coreDirs = ['src/styled']

async function runConfigOnly(payload: SystemWorkerPayload): Promise<void> {
  const { cwd, config } = payload
  const coreDir = resolveCorePackageDir()
  const userDirs = config.include.map(p =>
    resolve(cwd, p.split('**')[0].replace(/\/+$/, ''))
  )

  const fragments = await runEval(coreDir, [...coreDirs, ...userDirs], ['panda.base.ts'])
  if (fragments.length > 0 && config.include.length > 0) {
    await createPandaConfig(coreDir, { userDirectories: userDirs })
  }
}

async function runSystemCore(payload: SystemWorkerPayload): Promise<void> {
  await runConfigOnly(payload)
  const coreDir = resolveCorePackageDir()
  runPandaCodegen(coreDir) // Runs `panda` which does codegen + CSS extraction
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
  const coreDir = resolveCorePackageDir()

  if (watchMode) {
    await runConfigOnly(payload)

    // Panda watches .virtual and panda.config.ts — on change it re-runs. We just need to
    // emit system:compiled when Panda writes styles.css so the packager rebundles.
    const debouncedEmit = debounce(() => emit('system:compiled', {}), 200)
    await subscribe(join(coreDir, 'src/system'), (err, events) => {
      if (err) return log.error('[system:worker] Output watcher:', err)
      if (events?.some(ev => ev.path.endsWith('styles.css'))) debouncedEmit()
    })

    runPandaCodegen(coreDir, { watch: true })

    const debouncedConfig = debounce(async () => {
      log.debug('system:worker', 'virtual:fs:change → config')
      try {
        await runConfigOnly(payload)
      } catch (e) {
        log.error('[system:worker] Config failed:', e)
      }
    }, 300)
    on('virtual:fs:change', () => debouncedConfig())

    return new Promise(() => {})
  }

  await runSystemCore(payload)
}

export default runSystem

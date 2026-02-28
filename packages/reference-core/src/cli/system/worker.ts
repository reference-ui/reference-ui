import { resolve } from 'node:path'
import { on, emit } from '../event-bus'
import { log } from '../lib/log'
import { resolveCorePackageDir } from '../lib/resolve-core'
import { debounce } from '../lib/debounce'
import type { ReferenceUIConfig } from '../config'
import { runEval } from './eval'
import { createPandaConfig } from './config/panda'

export interface SystemWorkerPayload {
  cwd: string
  config: ReferenceUIConfig
  /** When true, stay alive and recompile on virtual:fs:change (config-affecting only) */
  watchMode?: boolean
}

const coreDirs = ['src/styled']

/** Paths that affect Panda config (tokens, recipes, patterns in src/styled, tokens.ts) */
function isConfigAffectingPath(path: string): boolean {
  return path.includes('/src/styled/') || path.includes('tokens.ts')
}

let configWritten = false

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
    configWritten = true
  }
  emit('system:config:complete', {})
  emit('system:complete', {})
  emit('config:ready', {})
}

/**
 * System worker - eval + config generation only.
 * Panda runs in the gen worker (separate thread).
 */
export async function runSystem(payload: SystemWorkerPayload): Promise<void> {
  const { watchMode = false } = payload

  await runConfigOnly(payload)

  if (watchMode) {
    const debouncedConfig = debounce(async () => {
      log.debug('system:worker', 'virtual:fs:change → config (config-affecting)')
      try {
        await runConfigOnly(payload)
      } catch (e) {
        log.error('[system:worker] Config failed:', e)
      }
    }, 150)

    on('gen:ready', () => {
      if (configWritten) {
        log.debug('system:worker', 'gen:ready → re-emit config:ready')
        emit('config:ready', {})
      }
    })

    on('virtual:fs:change', ({ path }: { path: string }) => {
      if (!isConfigAffectingPath(path)) {
        log.debug('system:worker', 'Non-styled file, skipping config rebuild')
        return
      }
      debouncedConfig()
    })

    return new Promise(() => {})
  }
}

export default runSystem

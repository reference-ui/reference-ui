import { resolve } from 'node:path'
import { emit } from '../event-bus'
import { log } from '../lib/log'
import { debounce } from '../lib/debounce'
import { resolveCorePackageDir } from '../lib/resolve-core'
import type { ReferenceUIConfig } from '../config'
import { runEval } from './eval'
import { createPandaConfig } from './config/panda'

export interface SystemWorkerPayload {
  cwd: string
  config: ReferenceUIConfig
  watchMode?: boolean
}

const CORE_DIRS = ['src/styled'] as const

export function isConfigAffectingPath(path: string): boolean {
  return path.includes('/src/styled/') || path.includes('tokens.ts')
}

/** Run eval + config generation. Emits when done. */
export async function runConfig(
  payload: SystemWorkerPayload,
  state?: { configWritten?: boolean }
): Promise<void> {
  const { cwd, config } = payload
  const coreDir = resolveCorePackageDir(cwd)
  const userDirs = config.include.map(p =>
    resolve(cwd, p.split('**')[0].replace(/\/+$/, ''))
  )

  const fragments = await runEval(coreDir, [...CORE_DIRS, ...userDirs], ['panda.base.ts'])
  if (fragments.length > 0 && config.include.length > 0) {
    await createPandaConfig(coreDir, {
      userDirectories: userDirs,
      includeCodegen: true,
    })
    if (state) state.configWritten = true
  }

  emit('system:config:complete', {})
  emit('system:complete', {})
  emit('config:ready', {})
}

export function onConfigRebuild(
  payload: SystemWorkerPayload,
  state: { configWritten?: boolean }
): () => void {
  return debounce(async () => {
    log.debug('system:worker', 'virtual:fs:change → config (config-affecting)')
    try {
      await runConfig(payload, state)
    } catch (e) {
      log.error('[system:worker] Config failed:', e)
    }
  }, 150)
}

export function onVirtualFsChange(
  payload: SystemWorkerPayload,
  state: { configWritten?: boolean }
): (ev: { path: string }) => void {
  const debouncedRebuild = onConfigRebuild(payload, state)
  return ({ path }) => {
    if (!isConfigAffectingPath(path)) {
      log.debug('system:worker', 'Non-styled file, skipping config rebuild')
      return
    }
    debouncedRebuild()
  }
}

export function onGenReady(state: { configWritten?: boolean }): () => void {
  return () => {
    if (!state.configWritten) return
    log.debug('system:worker', 'gen:ready → re-emit config:ready')
    emit('config:ready', {})
  }
}

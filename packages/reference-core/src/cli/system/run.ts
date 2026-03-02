import { resolve } from 'node:path'
import { emit } from '../event-bus'
import { log } from '../lib/log'
import { debounce } from '../lib/debounce'
import { resolveCorePackageDir } from '../lib/resolve-core'
import { loadUserConfig } from '../config'
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
  return (
    path.includes('/src/styled/') ||
    path.includes('tokens.ts') ||
    path.includes('ui.config.ts') ||
    path.includes('ui.config.js') ||
    path.includes('ui.config.mjs')
  )
}

/** Run eval + config generation. Emits when done. Uses freshConfig when provided (e.g. after ui.config reload). */
export async function runConfig(
  payload: SystemWorkerPayload,
  state?: { configWritten?: boolean },
  freshConfig?: ReferenceUIConfig
): Promise<void> {
  const { cwd } = payload
  const config = freshConfig ?? payload.config
  const coreDir = resolveCorePackageDir(cwd)
  const userDirs = config.include.map(p =>
    resolve(cwd, p.split('**')[0].replace(/\/+$/, ''))
  )

  const fragments = await runEval(coreDir, [...CORE_DIRS, ...userDirs], ['panda.base.ts'])
  if (fragments.length > 0 && config.include.length > 0) {
    await createPandaConfig(coreDir, {
      userDirectories: userDirs,
      includeCodegen: true,
      extends: config.extends,
    })
    if (state) state.configWritten = true
  }
  // createBaseSystem runs in gen worker after Panda emits styles.css

  emit('system:config:complete', {})
  emit('system:complete', {})
  emit('config:ready', freshConfig != null ? { config: freshConfig } : {})
}

export function onConfigRebuild(
  payload: SystemWorkerPayload,
  state: { configWritten?: boolean }
): () => void {
  return debounce(async () => {
    log.debug('system:worker', 'virtual:fs:change → config (config-affecting)')
    try {
      const freshConfig = await loadUserConfig(payload.cwd).catch(() => undefined)
      await runConfig(payload, state, freshConfig)
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

import { log } from '../lib/log'
import { emit } from '../lib/event-bus'
import { resolveCorePackageDir } from '../lib/paths'
import { installPackages } from './install'
import { FINAL_PACKAGES, RUNTIME_PACKAGES } from './packages'
import type { PackageDefinition } from './package'

export interface RunBundlePayload {
  cwd: string
  skipTypescript?: boolean
}

async function runBundlePhase(
  payload: RunBundlePayload,
  packages: PackageDefinition[],
  completionEvent: 'packager:runtime:complete' | 'packager:complete'
): Promise<void> {
  const { cwd, skipTypescript } = payload
  const coreDir = resolveCorePackageDir(cwd)
  const startedAt = Date.now()

  log.debug('packager', '📦 Packaging...')
  await installPackages(coreDir, cwd, packages)
  log.debug('packager', `✅ ${packages.length} package(s) ready`)
  const durationMs = Date.now() - startedAt

  emit(completionEvent, { packageCount: packages.length, durationMs })
  if (skipTypescript) {
    if (completionEvent === 'packager:runtime:complete') {
      emit('packager-ts:runtime:complete', {})
    }
    if (completionEvent === 'packager:complete') {
      emit('packager-ts:complete', {})
    }
  }
}

/**
 * Run the runtime bundle phase needed before reference builds.
 */
export async function runRuntimeBundle(payload: RunBundlePayload): Promise<void> {
  await runBundlePhase(payload, RUNTIME_PACKAGES, 'packager:runtime:complete')
}

/**
 * Run the final bundle phase after reference output exists.
 * Emits packager:complete when done. When skipTypescript is true, also emits
 * packager-ts:complete so sync completes without the packager-ts worker.
 */
export async function runBundle(payload: RunBundlePayload): Promise<void> {
  await runBundlePhase(payload, FINAL_PACKAGES, 'packager:complete')
}

/**
 * Handler for run:packager:bundle. Runs bundle with the given payload, emits packager:complete on success or logs on failure.
 */
export function onRunBundle(payload: RunBundlePayload): void {
  if (!payload.cwd) {
    log.error('[packager] run:packager:bundle: payload.cwd is undefined')
    return
  }
  runBundle(payload).catch((err) => {
    log.error('[packager] Bundle failed:', err)
  })
}

export function onRunRuntimeBundle(payload: RunBundlePayload): void {
  if (!payload.cwd) {
    log.error('[packager] run:packager:runtime:bundle: payload.cwd is undefined')
    return
  }
  runRuntimeBundle(payload).catch((err) => {
    log.error('[packager] Runtime bundle failed:', err)
  })
}

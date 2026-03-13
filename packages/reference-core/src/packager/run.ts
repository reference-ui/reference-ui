import { log } from '../lib/log'
import { emit } from '../lib/event-bus'
import { resolveCorePackageDir } from '../lib/paths'
import { installPackages } from './install'
import { PACKAGES } from './packages'

export interface RunBundlePayload {
  cwd: string
  skipTypescript?: boolean
}

/**
 * Run full bundle + install. Emits packager:complete when done.
 * When skipTypescript is true, also emits packager-ts:complete so sync completes without the packager-ts worker.
 */
export async function runBundle(payload: RunBundlePayload): Promise<void> {
  const { cwd, skipTypescript } = payload
  const coreDir = resolveCorePackageDir(cwd)

  log.debug('packager', '📦 Packaging...')
  await installPackages(coreDir, cwd, PACKAGES)
  log.debug('packager', `✅ ${PACKAGES.length} package(s) ready`)

  emit('packager:complete')
  if (skipTypescript) {
    emit('packager-ts:complete', {})
  }
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

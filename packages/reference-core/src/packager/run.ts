import { log } from '../lib/log'
import { emit } from '../lib/event-bus'
import { getCwd, getConfig } from '../config'
import { resolveCorePackageDir } from '../lib/paths'
import { installPackages } from './install'
import { PACKAGES } from './packages'

export interface RunBundlePayload {
  cwd: string
}

/**
 * Run full bundle + install. Emits packager:complete when done.
 * When skipTypescript, also emits packager-ts:complete so sync completes without packager-ts worker.
 */
export async function runBundle(payload: RunBundlePayload): Promise<void> {
  const { cwd } = payload
  const cliDir = resolveCorePackageDir(cwd)

  log.debug('packager', '📦 Packaging...')
  await installPackages(cliDir, cwd, PACKAGES)
  log.debug('packager', `✅ ${PACKAGES.length} package(s) ready`)

  emit('packager:complete')
  if (getConfig()?.skipTypescript) {
    emit('packager-ts:complete', {})
  }
}

/**
 * Handler for run:packager:bundle. Uses getCwd(), runs bundle, emits packager:complete on success or logs on failure.
 */
export function onRunBundle(): void {
  const cwd = getCwd()
  if (!cwd) {
    log.error('[packager] run:packager:bundle: getCwd() is undefined')
    return
  }
  runBundle({ cwd }).catch((err) => {
    log.error('[packager] Bundle failed:', err)
  })
}
